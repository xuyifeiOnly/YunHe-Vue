import type { PageQuery } from '../../../core/route-context'

/** 用户列表查询 */
export interface UserListQuery extends PageQuery {
  username?: string
  nickname?: string
  phone?: string
  status?: string
}

/** 创建用户请求体 */
export interface CreateUserBody {
  username: string
  password: string
  nickname?: string
  phone?: string
  email?: string
  gender?: string
  age?: number
  status?: string
  remark?: string
  roleIds?: string[]
}

/** 更新用户请求体 */
export interface UpdateUserBody extends Partial<Omit<CreateUserBody, 'username'>> {
  id: string
}

/** 修改个人密码请求体，兼容历史字段命名 */
export interface UpdateUserPasswordBody {
  oldPassword?: string
  oldPwd?: string
  newPassword?: string
  newPwd?: string
  repeatPassword?: string
  confirmPassword?: string
}

/** 重置密码请求体 */
export interface ResetUserPasswordBody {
  id?: string
  username?: string
  password: string
}

/** 更新个人信息请求体 */
export interface UpdateUserProfileBody {
  nickname?: string
  phone?: string
  email?: string
  gender?: string
}

/** 分配角色请求体 */
export interface AssignRolesBody {
  userId?: string
  id?: string
  roleIds?: string[]
}
