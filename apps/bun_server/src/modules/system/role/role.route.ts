import type { RoleEntity } from '../../../common'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface IdQuery {
  id?: string
}
interface IdsQuery {
  ids?: string
}
interface ChangeStatusBody {
  id: string
  status: string
}
interface AuthPermissionBody {
  roleId: string
  menuIds: string[]
}
type RoleBody = Partial<RoleEntity>

const routes = [
  {
    method: 'GET',
    path: '/system/role/list',
    description: '角色列表',
    permissions: ['system:role:query'],
    handler: ({
      query,
      services,
    }: RouteContext<unknown, Record<string, string | undefined>>) =>
      services.roleService.findList(query),
  },
  {
    method: 'GET',
    path: '/system/role/list/all',
    description: '全部角色',
    permissions: ['system:role:query'],
    handler: ({ services }: RouteContext) => services.roleService.findAll(),
  },
  {
    method: 'GET',
    path: '/system/role/detail',
    description: '角色详情',
    permissions: ['system:role:query'],
    handler: ({ query, services }: RouteContext<unknown, IdQuery>) =>
      services.roleService.findOneById(String(query.id ?? '')),
  },
  {
    method: 'POST',
    path: '/system/role/create',
    description: '创建角色',
    permissions: ['system:role:create'],
    operLog: { title: '角色管理', businessType: BusinessType.INSERT },
    handler: ({ body, services }: RouteContext<RoleBody>) =>
      services.roleService.create(body),
  },
  {
    method: 'PUT',
    path: '/system/role/update',
    description: '更新角色',
    permissions: ['system:role:update'],
    operLog: { title: '角色管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }: RouteContext<RoleBody>) =>
      services.roleService.update(body),
  },
  {
    method: 'DELETE',
    path: '/system/role/delete',
    description: '删除角色',
    permissions: ['system:role:delete'],
    operLog: { title: '角色管理', businessType: BusinessType.DELETE },
    handler: ({ query, services }: RouteContext<unknown, IdsQuery>) =>
      services.roleService.delete(String(query.ids ?? '')),
  },
  {
    method: 'PUT',
    path: '/system/role/changeStatus',
    description: '角色状态',
    permissions: ['system:role:update'],
    operLog: { title: '角色管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }: RouteContext<ChangeStatusBody>) =>
      services.roleService.changeStatus(body),
  },
  {
    method: 'POST',
    path: '/system/role/authPermission',
    description: '角色授权',
    permissions: ['system:role:update'],
    operLog: { title: '角色管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }: RouteContext<AuthPermissionBody>) =>
      services.roleService.authPermission(body),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
