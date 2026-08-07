import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

const routes = [
  { method: 'GET', path: '/monitor/server', description: '服务器信息', permissions: ['monitor:server:query'], handler: ({ services }: RouteContext) => services.serverService.serverInfo() },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
