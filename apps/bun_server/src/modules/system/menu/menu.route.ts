import type { MenuEntity } from '../../../common'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface MenuQuery { status?: string; menuName?: string; menuType?: string }
interface IdQuery { id?: string }
interface RoleQuery { roleId?: string }
type MenuBody = Partial<MenuEntity>

const routes = [
  { method: 'GET', path: '/system/menu/list', description: '菜单列表', permissions: ['system:menu:query'], handler: ({ query, services }: RouteContext<unknown, MenuQuery>) => services.menuService.findList(query) },
  { method: 'GET', path: '/system/menu/list/parent', description: '父级菜单', permissions: ['system:menu:query'], handler: ({ services }: RouteContext) => services.menuService.findParentList() },
  { method: 'GET', path: '/system/menu/list/role', description: '角色菜单', permissions: ['system:menu:query'], handler: ({ query, services }: RouteContext<unknown, RoleQuery>) => services.menuService.findListByRoleId(String(query.roleId ?? '')) },
  { method: 'GET', path: '/system/menu/detail', description: '菜单详情', permissions: ['system:menu:query'], handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.menuService.findOneById(String(query.id ?? '')) },
  { method: 'POST', path: '/system/menu/create', description: '创建菜单', permissions: ['system:menu:create'], operLog: { title: '菜单管理', businessType: BusinessType.INSERT }, handler: ({ body, services }: RouteContext<MenuBody>) => services.menuService.create(body) },
  { method: 'PUT', path: '/system/menu/update', description: '更新菜单', permissions: ['system:menu:update'], operLog: { title: '菜单管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<MenuBody>) => services.menuService.update(body) },
  { method: 'DELETE', path: '/system/menu/delete', description: '删除菜单', permissions: ['system:menu:delete'], operLog: { title: '菜单管理', businessType: BusinessType.DELETE }, handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.menuService.delete(String(query.id ?? '')) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
