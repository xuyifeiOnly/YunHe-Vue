import { BusinessException, CommonConstant, RedisConstant } from '../common'
import type { AuthUser } from './context'
import { getRouteMeta } from '../routes/meta'
import { getRequestIp } from '../utils/ip.util'
import { UserContext } from './user-context'

interface AuthContext {
  request: Request
  path: string
  server?: { requestIP?: (request: Request) => { address?: string } | null }
  services: {
    authService: { verifyToken(token: string): Promise<Omit<AuthUser, 'token'>> }
    redisService: {
      get(key: string): Promise<string | null>
      set(...args: [string, string, 'EX', number] | [string, string]): Promise<unknown>
      incr(key: string): Promise<number>
      expire(key: string, seconds: number): Promise<unknown>
    }
    config?: { server?: { isDemo?: boolean } }
  }
  set: { headers: Record<string, string> }
  user?: AuthUser
}

const THROTTLE_WINDOW_SECONDS = 10
const THROTTLE_LIMIT = 10
const THROTTLE_LOCK_SECONDS = 30 * 60

export async function authHook(context: AuthContext) {
  const routeMeta = getRouteMeta(context.request.method, context.path)
  if (!routeMeta?.skipThrottle) await checkThrottle(context)
  await checkDemoEnvironment(context, routeMeta?.demoProtect)
  await checkRepeatSubmit(context, routeMeta?.repeatSubmit)
  if (routeMeta?.public) return
  const authorization = context.request.headers.get(CommonConstant.AUTHORIZATION)
  if (!authorization?.startsWith(`${CommonConstant.TOKEN_PREFIX} `)) throw new BusinessException('登录状态已失效，请重新登录', 401)
  const token = authorization.slice(`${CommonConstant.TOKEN_PREFIX} `.length)
  context.user = { ...(await context.services.authService.verifyToken(token)), token }
  UserContext.setCurrentUser(context.user.username)
  await checkPermission(context, routeMeta?.permissions, routeMeta?.roles)
}

export async function getResponseCache(context: AuthContext) {
  const routeMeta = getRouteMeta(context.request.method, context.path)
  if (!routeMeta?.responseCache || context.request.method.toUpperCase() !== 'GET') return null
  return context.services.redisService.get(getResponseCacheKey(context))
}

export async function setResponseCache(context: AuthContext, response: unknown) {
  const routeMeta = getRouteMeta(context.request.method, context.path)
  if (!routeMeta?.responseCache || context.request.method.toUpperCase() !== 'GET' || response instanceof Response) return
  const ttl = typeof routeMeta.responseCache === 'object' ? routeMeta.responseCache.ttl ?? 60 : 60
  await context.services.redisService.set(getResponseCacheKey(context), JSON.stringify(response), 'EX', ttl)
}

async function checkThrottle(context: AuthContext) {
  const clientIp = getClientIp(context.request, context.server)
  const pathKey = context.path.replace(/[^a-zA-Z0-9:_-]/g, '_')
  const throttleKey = `${RedisConstant.THROTTLE_LIMIT}:${clientIp}:${pathKey}`
  const lockKey = `${throttleKey}:lock`
  if (await context.services.redisService.get(lockKey)) throw new BusinessException('请求过于频繁，请稍后再试', 429)
  const current = await context.services.redisService.incr(throttleKey)
  if (current === 1) await context.services.redisService.expire(throttleKey, THROTTLE_WINDOW_SECONDS)
  if (current > THROTTLE_LIMIT) {
    await context.services.redisService.set(lockKey, '1', 'EX', THROTTLE_LOCK_SECONDS)
    throw new BusinessException('请求过于频繁，请稍后再试', 429)
  }
}

async function checkDemoEnvironment(context: AuthContext, demoProtect?: boolean) {
  const method = context.request.method.toUpperCase()
  if (!context.services.config?.server?.isDemo || !demoProtect || method === 'GET') return
  if (context.path.endsWith('/login') || context.path.endsWith('/logout')) return
  throw new BusinessException('演示环境，不允许操作')
}

async function checkRepeatSubmit(context: AuthContext, repeatSubmit?: boolean | { interval?: number }) {
  if (!repeatSubmit || !['POST', 'PUT', 'DELETE'].includes(context.request.method.toUpperCase())) return
  const body = await context.request.clone().text().catch(() => '')
  const token = context.request.headers.get(CommonConstant.AUTHORIZATION) ?? getClientIp(context.request, context.server)
  const hash = await sha256(`${context.request.method}:${context.path}:${token}:${body}`)
  const key = `${RedisConstant.REPEAT_SUBMIT_KEY}:${hash}`
  if (await context.services.redisService.get(key)) throw new BusinessException('不允许重复提交，请稍后再试')
  const interval = typeof repeatSubmit === 'object' ? repeatSubmit.interval ?? 5 : 5
  await context.services.redisService.set(key, '1', 'EX', interval)
}

async function checkPermission(context: AuthContext, permissions?: string[], roles?: string[]) {
  if (!permissions?.length && !roles?.length) return
  const userId = context.user?.userId
  if (!userId) throw new BusinessException('登录状态已失效，请重新登录', 401)
  const [permissionValue, roleValue] = await Promise.all([
    context.services.redisService.get(`${RedisConstant.ADMIN_USER_PERMISSIONS}:${userId}`),
    context.services.redisService.get(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`),
  ])
  const userRoles = parseCacheList(roleValue)
  if (userRoles.includes(CommonConstant.ADMIN_ROLE_CODE)) return
  const hasRole = !roles?.length || roles.some((role) => userRoles.includes(role))
  const userPermissions = parseCacheList(permissionValue)
  const hasPermission = !permissions?.length || permissions.some((permission) => userPermissions.includes(permission))
  if (!hasRole || !hasPermission) throw new BusinessException('没有操作权限', 403)
}

function parseCacheList(value: string | null) {
  if (!value) return []
  try {
    const list = JSON.parse(value)
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

export function getClientIp(request: Request, server?: AuthContext['server']) {
  return getRequestIp(request, server)
}

function getResponseCacheKey(context: AuthContext) {
  return `${RedisConstant.RESPONSE_CACHE}:${context.request.method}:${context.path}:${new URL(context.request.url).search}`
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('')
}
