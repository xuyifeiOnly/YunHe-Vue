import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'
import { idsFrom } from '../utils'

interface IdsBody {
  ids?: string | string[]
  id?: string
  jobIds?: string | string[]
  logIds?: string | string[]
}
type Query = Record<string, string | undefined>

const routes = [
  {
    method: 'GET',
    path: '/monitor/log/list',
    description: '操作日志',
    permissions: ['monitor:operlog:query'],
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.operlogList(query),
  },
  {
    method: 'GET',
    path: '/monitor/log/logininfor/list',
    description: '登录日志',
    permissions: ['monitor:logininfor:query'],
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.logininforList(query),
  },
  {
    method: 'DELETE',
    path: '/monitor/log/logininfor/delete',
    description: '登录日志删除',
    permissions: ['monitor:logininfor:delete'],
    operLog: { title: '登录日志', businessType: BusinessType.DELETE },
    handler: ({ query, body, services }: RouteContext<IdsBody, IdsBody>) =>
      services.logService.deleteLogininfor(idsFrom({ ...query, ...body })),
  },
  {
    method: 'DELETE',
    path: '/monitor/log/logininfor/clear',
    description: '登录日志清空',
    permissions: ['monitor:logininfor:clear'],
    operLog: { title: '登录日志', businessType: BusinessType.DELETE },
    handler: ({ services }: RouteContext) =>
      services.logService.clearLogininfor(),
  },
  {
    method: 'GET',
    path: '/monitor/log/logininfor/export',
    description: '登录日志导出',
    permissions: ['monitor:logininfor:export'],
    operLog: { title: '登录日志', businessType: BusinessType.EXPORT },
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.exportLogininfor(query),
  },
  {
    method: 'POST',
    path: '/monitor/log/logininfor/export',
    description: '登录日志导出',
    permissions: ['monitor:logininfor:export'],
    operLog: { title: '登录日志', businessType: BusinessType.EXPORT },
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.exportLogininfor(query),
  },
  {
    method: 'GET',
    path: '/monitor/log/operlog/list',
    description: '操作日志',
    permissions: ['monitor:operlog:query'],
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.operlogList(query),
  },
  {
    method: 'DELETE',
    path: '/monitor/log/operlog/delete',
    description: '操作日志删除',
    permissions: ['monitor:operlog:delete'],
    operLog: { title: '操作日志', businessType: BusinessType.DELETE },
    handler: ({ query, body, services }: RouteContext<IdsBody, IdsBody>) =>
      services.logService.deleteOperlog(idsFrom({ ...query, ...body })),
  },
  {
    method: 'DELETE',
    path: '/monitor/log/operlog/clear',
    description: '操作日志清空',
    permissions: ['monitor:operlog:clear'],
    operLog: { title: '操作日志', businessType: BusinessType.DELETE },
    handler: ({ services }: RouteContext) => services.logService.clearOperlog(),
  },
  {
    method: 'GET',
    path: '/monitor/log/operlog/export',
    description: '操作日志导出',
    permissions: ['monitor:operlog:export'],
    operLog: { title: '操作日志', businessType: BusinessType.EXPORT },
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.exportOperlog(query),
  },
  {
    method: 'POST',
    path: '/monitor/log/operlog/export',
    description: '操作日志导出',
    permissions: ['monitor:operlog:export'],
    operLog: { title: '操作日志', businessType: BusinessType.EXPORT },
    handler: ({ query, services }: RouteContext<unknown, Query>) =>
      services.logService.exportOperlog(query),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
