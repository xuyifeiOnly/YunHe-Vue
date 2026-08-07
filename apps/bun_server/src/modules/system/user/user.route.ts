import type { UserEntity } from '../../../common'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface IdQuery { id?: string }
interface IdsQuery { ids?: string }
interface UpdatePasswordBody { oldPassword: string; newPassword: string; repeatPassword: string }
interface ResetPasswordBody { username?: string; id?: string; password?: string }
interface AssignRolesBody { userId?: string; id?: string; roleIds?: string[] }
type UserBody = Partial<UserEntity> & { roleIds?: string[] }

const routes = [
  { method: 'GET', path: '/system/user/list', description: '用户列表', permissions: ['system:user:query'], handler: ({ query, services }: RouteContext<unknown, Record<string, string | undefined>>) => services.userService.findList(query) },
  { method: 'GET', path: '/system/user/detail', description: '用户详情', permissions: ['system:user:query'], handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.userService.findOneById(String(query.id ?? '')) },
  { method: 'POST', path: '/system/user/create', description: '创建用户', permissions: ['system:user:create'], operLog: { title: '用户管理', businessType: BusinessType.INSERT }, handler: ({ body, services }: RouteContext<UserBody>) => services.userService.create(body) },
  { method: 'PUT', path: '/system/user/update', description: '更新用户', permissions: ['system:user:update'], operLog: { title: '用户管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<UserBody>) => services.userService.update(body) },
  { method: 'DELETE', path: '/system/user/delete', description: '删除用户', permissions: ['system:user:delete'], operLog: { title: '用户管理', businessType: BusinessType.DELETE }, handler: ({ query, services }: RouteContext<unknown, IdsQuery>) => services.userService.delete(String(query.ids ?? '')) },
  { method: 'PUT', path: '/system/user/updatePassword', description: '修改密码', permissions: ['system:user:update'], operLog: { title: '用户管理', businessType: BusinessType.UPDATE }, handler: ({ body, user, services }: RouteContext<UpdatePasswordBody>) => services.userService.updatePassword(user!.userId, body) },
  { method: 'GET', path: '/system/user/profile', description: '个人信息', permissions: ['system:user:query'], handler: ({ user, services }: RouteContext) => services.userService.getProfile(user!.userId) },
  { method: 'PUT', path: '/system/user/profile/update', description: '更新个人信息', permissions: ['system:user:update'], operLog: { title: '用户管理', businessType: BusinessType.UPDATE }, handler: ({ body, user, services }: RouteContext<UserBody>) => services.userService.updateProfile(user!.userId, body) },
  { method: 'PUT', path: '/system/user/resetPassword', description: '重置密码', permissions: ['system:user:update'], operLog: { title: '用户管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<ResetPasswordBody>) => services.userService.resetPassword(body) },
  { method: 'PUT', path: '/system/user/assignRoles', description: '分配角色', permissions: ['system:user:update'], operLog: { title: '用户管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<AssignRolesBody>) => services.userService.assignRoles(body) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
