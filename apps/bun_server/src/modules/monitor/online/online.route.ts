import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import { parseString } from '../../../core/validation'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface ForceLogoutQuery { userId?: string; uuid?: string }
type Query = Record<string, string | undefined>

function parseForceLogoutQuery(query: ForceLogoutQuery) {
  return {
    userId: parseString(query.userId, '用户ID', { required: true }),
    uuid: parseString(query.uuid, '会话标识', { required: true }),
  }
}

const routes = [
  { method: 'GET', path: '/monitor/online/list', description: '在线用户', permissions: ['monitor:online:query'], handler: ({ query, services }: RouteContext<unknown, Query>) => services.onlineService.onlineList(query) },
  { method: 'GET', path: '/monitor/online/count', description: '在线数量', permissions: ['monitor:online:query'], handler: ({ services }: RouteContext) => services.onlineService.onlineCount() },
  { method: 'DELETE', path: '/monitor/online/forceLogout', description: '强制退出', permissions: ['monitor:online:forceLogout'], operLog: { title: '在线用户', businessType: BusinessType.DELETE }, handler: ({ query, services }: RouteContext<unknown, ForceLogoutQuery>) => services.onlineService.forceLogout(parseForceLogoutQuery(query)) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
