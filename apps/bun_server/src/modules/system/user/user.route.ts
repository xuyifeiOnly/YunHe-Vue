import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type {
  AuthedRouteContext,
  IdQuery,
  IdsQuery,
} from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'
import type {
  AssignRolesBody,
  CreateUserBody,
  ResetUserPasswordBody,
  UpdateUserBody,
  UpdateUserPasswordBody,
  UpdateUserProfileBody,
  UserListQuery,
} from './user.dto'

const routes = [
  {
    method: 'GET',
    path: '/system/user/list',
    description: '用户列表',
    permissions: ['system:user:query'],
    handler: ({ query, services }) =>
      services.userService.findList(query as UserListQuery),
  },
  {
    method: 'GET',
    path: '/system/user/detail',
    description: '用户详情',
    permissions: ['system:user:query'],
    handler: ({ query, services }) =>
      services.userService.findOneById(String((query as IdQuery).id ?? '')),
  },
  {
    method: 'POST',
    path: '/system/user/create',
    description: '创建用户',
    permissions: ['system:user:create'],
    operLog: { title: '用户管理', businessType: BusinessType.INSERT },
    handler: ({ body, services }) =>
      services.userService.create(body as CreateUserBody),
  },
  {
    method: 'PUT',
    path: '/system/user/update',
    description: '更新用户',
    permissions: ['system:user:update'],
    operLog: { title: '用户管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }) =>
      services.userService.update(body as UpdateUserBody),
  },
  {
    method: 'DELETE',
    path: '/system/user/delete',
    description: '删除用户',
    permissions: ['system:user:delete'],
    operLog: { title: '用户管理', businessType: BusinessType.DELETE },
    handler: ({ query, services }) =>
      services.userService.delete(String((query as IdsQuery).ids ?? '')),
  },
  {
    method: 'PUT',
    path: '/system/user/updatePassword',
    description: '修改密码',
    permissions: ['system:user:update'],
    operLog: { title: '用户管理', businessType: BusinessType.UPDATE },
    handler: ({
      body,
      user,
      services,
    }: AuthedRouteContext<UpdateUserPasswordBody>) =>
      services.userService.updatePassword(user.userId, body),
  },
  {
    method: 'GET',
    path: '/system/user/profile',
    description: '个人信息',
    permissions: ['system:user:query'],
    handler: ({ user, services }: AuthedRouteContext) =>
      services.userService.getProfile(user.userId),
  },
  {
    method: 'PUT',
    path: '/system/user/profile/update',
    description: '更新个人信息',
    permissions: ['system:user:update'],
    operLog: { title: '用户管理', businessType: BusinessType.UPDATE },
    handler: ({
      body,
      user,
      services,
    }: AuthedRouteContext<UpdateUserProfileBody>) =>
      services.userService.updateProfile(user.userId, body),
  },
  {
    method: 'PUT',
    path: '/system/user/resetPassword',
    description: '重置密码',
    permissions: ['system:user:update'],
    operLog: { title: '用户管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }) =>
      services.userService.resetPassword(body as ResetUserPasswordBody),
  },
  {
    method: 'PUT',
    path: '/system/user/assignRoles',
    description: '分配角色',
    permissions: ['system:user:update'],
    operLog: { title: '用户管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }) =>
      services.userService.assignRoles(body as AssignRolesBody),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
