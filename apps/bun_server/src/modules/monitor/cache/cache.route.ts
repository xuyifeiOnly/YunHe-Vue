import { BusinessException } from "../../../common";
import { BusinessType } from "../../../entities/monitor/operlog.entity";
import type { RouteContext } from "../../../core/route-context";
import type { AppLike, RouteDefinition } from "../../../routes/meta";
import { registerRouteDefinitions } from "../../../routes/meta";

interface CacheKeysQuery {
  pattern?: string;
  cacheName?: string;
  name?: string;
}
interface CacheDetailQuery {
  key?: string;
  cacheKey?: string;
}
interface CacheDeleteQuery {
  pattern?: string;
  key?: string;
  cacheKey?: string;
}
interface CacheNameDeleteQuery {
  cacheName?: string;
  name?: string;
}

function requireCachePattern(query: CacheDeleteQuery) {
  const pattern = String(
    query.pattern ?? query.key ?? query.cacheKey ?? "",
  ).trim();
  if (!pattern) throw new BusinessException("缓存键名不能为空");
  if (pattern === "*") throw new BusinessException("不允许删除全部缓存");
  return pattern;
}

const routes = [
  {
    method: "GET",
    path: "/monitor/cache",
    description: "缓存信息",
    permissions: ["monitor:cache:query"],
    handler: ({ services }: RouteContext) => services.cacheService.cacheInfo(),
  },
  {
    method: "GET",
    path: "/monitor/cache/names",
    description: "缓存名称",
    permissions: ["monitor:cache:query"],
    handler: ({ services }: RouteContext) => services.cacheService.cacheNames(),
  },
  {
    method: "GET",
    path: "/monitor/cache/keys",
    description: "缓存键列表",
    permissions: ["monitor:cache:query"],
    handler: ({ query, services }: RouteContext<unknown, CacheKeysQuery>) =>
      services.cacheService.cacheKeys(
        String(query.pattern ?? query.cacheName ?? query.name ?? "*"),
      ),
  },
  {
    method: "GET",
    path: "/monitor/cache/detail",
    description: "缓存详情",
    permissions: ["monitor:cache:query"],
    handler: ({ query, services }: RouteContext<unknown, CacheDetailQuery>) =>
      services.cacheService.cacheDetail(
        String(query.key ?? query.cacheKey ?? ""),
      ),
  },
  {
    method: "GET",
    path: "/monitor/cache/keys/detail",
    description: "缓存键详情",
    permissions: ["monitor:cache:query"],
    handler: ({ query, services }: RouteContext<unknown, CacheDetailQuery>) =>
      services.cacheService.cacheDetail(
        String(query.key ?? query.cacheKey ?? ""),
      ),
  },
  {
    method: "DELETE",
    path: "/monitor/cache/delete",
    description: "缓存删除",
    permissions: ["monitor:cache:delete"],
    operLog: { title: "缓存监控", businessType: BusinessType.DELETE },
    handler: ({ query, services }: RouteContext<unknown, CacheDeleteQuery>) =>
      services.cacheService.deleteCacheKeys(requireCachePattern(query)),
  },
  {
    method: "DELETE",
    path: "/monitor/cache/names/delete",
    description: "缓存名称删除",
    permissions: ["monitor:cache:delete"],
    operLog: { title: "缓存监控", businessType: BusinessType.DELETE },
    handler: ({
      query,
      services,
    }: RouteContext<unknown, CacheNameDeleteQuery>) =>
      services.cacheService.deleteCacheName(
        String(query.cacheName ?? query.name ?? ""),
      ),
  },
  {
    method: "DELETE",
    path: "/monitor/cache/keys/delete",
    description: "缓存键删除",
    permissions: ["monitor:cache:delete"],
    operLog: { title: "缓存监控", businessType: BusinessType.DELETE },
    handler: ({ query, services }: RouteContext<unknown, CacheDetailQuery>) =>
      services.cacheService.deleteCacheKey(
        String(query.key ?? query.cacheKey ?? ""),
      ),
  },
] satisfies RouteDefinition[];

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes);
}
