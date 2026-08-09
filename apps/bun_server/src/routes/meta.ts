import { CommonConstant } from '../common'
import type { RouteHandler } from '../core/route-context'

export interface RouteMeta {
  /** 请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 路由路径 */
  path: string
  /** 是否公开访问，公开路由跳过认证 */
  public?: boolean
  /** 访问该路由所需权限标识 */
  permissions?: string[]
  /** 访问该路由所需角色标识 */
  roles?: string[]
  /** 是否跳过接口限流 */
  skipThrottle?: boolean
  /** 是否跳过统一响应转换 */
  skipTransform?: boolean
  /** 是否开启重复提交拦截，可配置拦截间隔（秒） */
  repeatSubmit?: boolean | { interval?: number }
  /** 是否开启响应缓存，可配置缓存时长（秒） */
  responseCache?: boolean | { ttl?: number }
  /** 是否开启演示环境保护 */
  demoProtect?: boolean
  /** 操作日志配置，包含日志标题和业务类型 */
  operLog?: { title: string; businessType?: string }
  /** 路由说明，用于文档或接口描述 */
  description?: string
}

/**
 * 单条路由定义。
 * handler 使用宽松函数签名以兼容各路由文件中具体的 Body/Query 泛型以及 AuthedRouteContext，
 * 具体类型由路由文件在 satisfies RouteDefinition 时自行约束。
 */
export type RouteDefinition = RouteMeta & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => unknown
}

/** 应用实例需要的最小方法集合。handler 入参使用 any 以兼容 Elysia 重载签名。 */
export interface AppLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(path: string, handler: (...args: any[]) => unknown): unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post(path: string, handler: (...args: any[]) => unknown): unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put(path: string, handler: (...args: any[]) => unknown): unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(path: string, handler: (...args: any[]) => unknown): unknown
}

/** 动态路由模块需导出的注册函数 */
export interface RouteModule {
  registerRoutes?: (app: AppLike) => void | Promise<void>
}

const routeMetaMap = new Map<string, RouteMeta>()

function routeKey(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`
}

export function registerRouteMeta(meta: RouteMeta) {
  const normalized = normalizeRouteMeta(meta)
  routeMetaMap.set(routeKey(normalized.method, normalized.path), normalized)
}

export function registerRouteDefinitions(
  app: AppLike,
  routes: RouteDefinition[],
) {
  routes.forEach(({ handler, ...meta }) => {
    registerRouteMeta(meta)
    app[meta.method.toLowerCase() as Lowercase<RouteMeta['method']>](
      meta.path,
      handler as RouteHandler,
    )
  })
}

export function getRouteMetas() {
  return Array.from(routeMetaMap.values())
}

export function getRouteMeta(method: string, path?: string) {
  if (!path) return undefined
  // 精确匹配优先，避免 endsWith 造成的后缀误匹配
  const upperMethod = method.toUpperCase()
  const exact = routeMetaMap.get(routeKey(upperMethod, path))
  if (exact) return exact
  // 兜底：保留历史行为，兼容全局前缀拼接场景
  for (const [key, meta] of routeMetaMap) {
    if (key.startsWith(`${upperMethod} `) && path.endsWith(meta.path))
      return meta
  }
  return undefined
}

export function isPublicRoute(method: string, path?: string) {
  return Boolean(getRouteMeta(method, path)?.public)
}

function normalizeRouteMeta(meta: RouteMeta): RouteMeta {
  const method = meta.method.toUpperCase() as RouteMeta['method']
  return {
    ...meta,
    method,
    demoProtect: meta.demoProtect ?? (method !== 'GET' && !meta.public),
    repeatSubmit:
      meta.repeatSubmit ??
      (['POST', 'PUT', 'DELETE'].includes(method)
        ? { interval: CommonConstant.REPEAT_SUBMIT_INTERVAL }
        : false),
  }
}
