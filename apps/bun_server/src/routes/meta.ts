import type { RouteHandler } from '../core/route-context'

export interface RouteMeta {
  /** 请求方法 */
  method: "GET" | "POST" | "PUT" | "DELETE"
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

export type AppLike = Record<string, (path: string, handler: RouteHandler<any, any, any>) => unknown>
export type RouteDefinition = RouteMeta & { handler: RouteHandler<any, any, any> }

const routeMetas: RouteMeta[] = []

export function registerRouteMeta(meta: RouteMeta) {
  routeMetas.push(normalizeRouteMeta(meta))
}

export function registerRouteDefinitions(app: AppLike, routes: RouteDefinition[]) {
  routes.forEach(({ handler, ...meta }) => {
    registerRouteMeta(meta)
    app[meta.method.toLowerCase()](meta.path, handler)
  })
}

export function getRouteMetas() {
  return routeMetas
}

export function getRouteMeta(method: string, path: string) {
  return routeMetas.find((meta) => meta.method.toUpperCase() === method.toUpperCase() && path.endsWith(meta.path))
}

export function isPublicRoute(method: string, path: string) {
  return Boolean(getRouteMeta(method, path)?.public)
}

function normalizeRouteMeta(meta: RouteMeta): RouteMeta {
  const method = meta.method.toUpperCase() as RouteMeta['method']
  return {
    ...meta,
    method,
    demoProtect: meta.demoProtect ?? (method !== 'GET' && !meta.public),
    repeatSubmit: meta.repeatSubmit ?? (['POST', 'PUT', 'DELETE'].includes(method) ? { interval: 5 } : false),
  }
}
