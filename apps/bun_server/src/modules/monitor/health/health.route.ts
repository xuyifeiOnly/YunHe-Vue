import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

const routes = [
  {
    method: 'GET',
    path: '/monitor/health',
    public: true,
    description: '健康检查',
    handler: ({ services }: RouteContext) => services.healthService.readiness(),
  },
  {
    method: 'GET',
    path: '/monitor/health/live',
    public: true,
    description: '存活检查',
    handler: ({ services }: RouteContext) => services.healthService.health(),
  },
  {
    method: 'GET',
    path: '/monitor/health/ready',
    public: true,
    description: '就绪检查',
    handler: ({ services }: RouteContext) => services.healthService.readiness(),
  },
  {
    method: 'GET',
    path: '/monitor/health/database',
    public: true,
    description: '数据库检查',
    handler: ({ services }: RouteContext) =>
      services.healthService.databaseHealth(),
  },
  {
    method: 'GET',
    path: '/monitor/health/memory',
    public: true,
    description: '内存检查',
    handler: ({ services }: RouteContext) =>
      services.healthService.memoryHealth(),
  },
  {
    method: 'GET',
    path: '/monitor/health/rss',
    public: true,
    description: 'RSS 检查',
    handler: ({ services }: RouteContext) => services.healthService.rssHealth(),
  },
  {
    method: 'GET',
    path: '/monitor/health/storage',
    public: true,
    description: '磁盘检查',
    handler: ({ services }: RouteContext) =>
      services.healthService.storageHealth(),
  },
  {
    method: 'GET',
    path: '/monitor/health/network',
    public: true,
    description: '网络检查',
    handler: ({ services }: RouteContext) =>
      services.healthService.networkHealth(),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
