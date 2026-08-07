import {
  Equal,
  In,
  Like,
  Not,
  type FindOptionsWhere,
  type Repository,
} from 'typeorm'
import {
  BusinessException,
  CommonConstant,
  RedisConstant,
  RoleEntity,
  UserEntity,
} from '../../../common'
import {
  encryptPassword,
  formatTime,
  isValidEmail,
  isValidPhone,
  validate,
  verifyPassword,
} from '../../../utils'
import type { RedisService } from '../../../shared/redis.service'
import { pageResult, parseIds, parsePagination } from '../../../core/validation'
import type {
  AssignRolesBody,
  CreateUserBody,
  ResetUserPasswordBody,
  UpdateUserBody,
  UpdateUserPasswordBody,
  UpdateUserProfileBody,
  UserListQuery,
} from './user.dto'

export class UserService {
  constructor(
    private readonly redisService: RedisService,
    private readonly userRepository: Repository<UserEntity>,
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  public async findList(query: UserListQuery) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<UserEntity> = {}
    if (query.username) where.username = Like(`%${query.username}%`)
    if (query.nickname) where.nickname = Like(`%${query.nickname}%`)
    if (query.phone) where.phone = Like(`%${query.phone}%`)
    if (query.status) where.status = query.status
    const [list, total] = await this.userRepository.findAndCount({
      where,
      relations: { roles: true },
      skip: page.skip,
      take: page.take,
      order: { createTime: 'DESC' },
    })
    const records = list.map((item) => this.omitPassword(item))
    return pageResult(records, total)
  }

  public async findOneById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    })
    if (!user) throw new BusinessException('该用户不存在')
    return this.omitPassword(user)
  }

  public async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username, status: CommonConstant.STATUS_NORMAL },
      relations: { roles: true },
    })
  }

  public async create(data: CreateUserBody) {
    validate(data, [
      { field: 'username', label: '用户名', required: true, min: 2, max: 20 },
      { field: 'password', label: '密码', required: true, min: 6 },
      {
        field: 'phone',
        label: '手机号',
        pattern: /^1[3-9]\d{9}$/,
        validator: (v) =>
          v && !isValidPhone(String(v)) ? '手机号格式不正确' : undefined,
      },
      {
        field: 'email',
        label: '邮箱',
        validator: (v) =>
          v && !isValidEmail(String(v)) ? '邮箱格式不正确' : undefined,
      },
    ])
    await this.validateUserFields(data)
    const user = this.userRepository.create(data)
    user.password = await encryptPassword(data.password)
    user.roles = data.roleIds?.length
      ? await this.roleRepository.findBy({ id: In(data.roleIds) })
      : []
    await this.userRepository.save(user)
    return '添加成功'
  }

  public async update(data: UpdateUserBody) {
    if (!data.id) throw new BusinessException('用户ID不能为空')
    const user = await this.userRepository.findOne({
      where: { id: data.id },
      relations: { roles: true },
    })
    if (!user) throw new BusinessException('该用户不存在')
    if (
      user.id === CommonConstant.ADMIN_USER_ID &&
      data.status === CommonConstant.STATUS_DISABLE
    )
      throw new BusinessException('管理员账号不能停用')
    await this.validateUserFields(data, data.id)
    Object.assign(user, data)
    if (data.roleIds)
      user.roles = data.roleIds.length
        ? await this.roleRepository.findBy({ id: In(data.roleIds) })
        : []
    await this.userRepository.save(user)
    await this.cleanUserRelatedCache(data.id)
    return '更新成功'
  }

  public async delete(ids: string) {
    const idList = parseIds(ids, '用户ID')
    if (idList.includes(CommonConstant.ADMIN_USER_ID))
      throw new BusinessException('管理员账号无法被删除')
    const users = await this.userRepository.find({
      where: { id: In(idList) },
      relations: { roles: true },
    })
    for (const user of users) {
      user.roles = []
      await this.userRepository.save(user)
    }
    await this.userRepository.delete({ id: In(idList) })
    await Promise.all(idList.map((id) => this.cleanUserRelatedCache(id)))
    return '删除成功'
  }

  public async updateLoginTime(userId: string) {
    await this.userRepository.update(userId, { loginTime: formatTime() })
  }

  public async updatePassword(
    userId: string,
    updateDto: UpdateUserPasswordBody,
  ) {
    const oldPassword = updateDto.oldPassword ?? updateDto.oldPwd ?? ''
    const newPassword = updateDto.newPassword ?? updateDto.newPwd ?? ''
    const repeatPassword =
      updateDto.repeatPassword ?? updateDto.confirmPassword ?? newPassword
    if (!oldPassword || !newPassword)
      throw new BusinessException('旧密码和新密码不能为空')
    if (newPassword !== repeatPassword)
      throw new BusinessException('两次输入的新密码不一致')
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
      select: { id: true, password: true },
    })
    if (!user) throw new BusinessException('用户不存在')
    if (!(await verifyPassword(oldPassword, user.password)))
      throw new BusinessException('旧密码错误')
    if (await verifyPassword(newPassword, user.password))
      throw new BusinessException('新密码不能与原密码相同')
    await this.userRepository.update(userId, {
      password: await encryptPassword(newPassword),
    })
    await this.cleanUserRelatedCache(userId)
    return '修改成功'
  }

  public async getProfile(userId: string) {
    const user = await this.findOneById(userId)
    const roles = await this.roleRepository.find({
      where: { status: CommonConstant.STATUS_NORMAL },
      order: { roleSort: 'ASC' },
    })
    return { user, roles, roleIds: user.roles?.map((role) => role.id) ?? [] }
  }

  public async updateProfile(userId: string, data: UpdateUserProfileBody) {
    await this.validateUserFields({ ...data, id: userId }, userId)
    await this.userRepository.update(userId, {
      nickname: data.nickname,
      phone: data.phone,
      email: data.email,
      gender: data.gender,
    })
    await this.cleanUserRelatedCache(userId)
    return '修改成功'
  }

  public async resetPassword(data: ResetUserPasswordBody) {
    if (!data.password) throw new BusinessException('新密码不能为空')
    const where: FindOptionsWhere<UserEntity>[] = []
    if (data.id) where.push({ id: Equal(data.id) })
    if (data.username) where.push({ username: Equal(data.username) })
    if (!where.length) throw new BusinessException('用户标识不能为空')
    const user = await this.userRepository.findOne({
      where,
      select: { id: true, password: true },
    })
    if (!user) throw new BusinessException('该用户不存在')
    if (await verifyPassword(data.password, user.password))
      throw new BusinessException('新密码不能与原密码相同')
    await this.userRepository.update(user.id, {
      password: await encryptPassword(data.password),
    })
    await this.cleanUserAllCache(user.id)
    return '密码重置成功，请重新登录'
  }

  public async assignRoles(data: AssignRolesBody) {
    const userId = data.userId ?? data.id
    if (!userId) throw new BusinessException('用户ID不能为空')
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    })
    if (!user) throw new BusinessException('该用户不存在')
    user.roles = data.roleIds?.length
      ? await this.roleRepository.findBy({ id: In(data.roleIds) })
      : []
    await this.userRepository.save(user)
    await this.cleanUserRelatedCache(userId)
    return '分配成功'
  }

  public async cleanUserRelatedCache(userId: string) {
    await this.redisService.del(
      `${RedisConstant.ADMIN_USER_ROLES}:${userId}`,
      `${RedisConstant.ADMIN_USER_PERMISSIONS}:${userId}`,
    )
  }

  public async cleanUserAllCache(userId: string) {
    const onlineKeys = await this.redisService.scanKeys(
      `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:*`,
    )
    const tokenKeys = await this.redisService.scanKeys(
      `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:*`,
    )
    const keys = [
      `${RedisConstant.ADMIN_USER_ROLES}:${userId}`,
      `${RedisConstant.ADMIN_USER_PERMISSIONS}:${userId}`,
      ...onlineKeys,
      ...tokenKeys,
    ]
    if (keys.length) await this.redisService.del(...keys)
  }

  private async validateUserFields(
    data: { id?: string; username?: string; phone?: string; email?: string },
    userId?: string,
  ) {
    if (data.username) {
      const where: FindOptionsWhere<UserEntity> = {
        username: Equal(data.username),
      }
      if (userId) where.id = Not(userId)
      if (await this.userRepository.existsBy(where))
        throw new BusinessException('该用户已存在')
    }
    if (await this.checkPhoneExists(data.phone, userId))
      throw new BusinessException('该手机号已存在')
    if (data.email) {
      const where: FindOptionsWhere<UserEntity> = { email: Equal(data.email) }
      if (userId) where.id = Not(userId)
      if (await this.userRepository.existsBy(where))
        throw new BusinessException('该邮箱已存在')
    }
  }

  private async checkPhoneExists(phone?: string, userId?: string) {
    if (!phone) return false
    const where: FindOptionsWhere<UserEntity> = { phone: Equal(phone) }
    if (userId) where.id = Not(userId)
    return this.userRepository.existsBy(where)
  }

  private omitPassword(user: UserEntity) {
    const { password, ...rest } = user
    return rest as Omit<UserEntity, 'password'>
  }
}
