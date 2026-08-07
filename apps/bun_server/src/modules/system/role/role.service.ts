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
  MenuEntity,
  RedisConstant,
  RoleEntity,
} from '../../../common'
import { parsePagination } from '../../../core/validation'
import type { RedisService } from '../../../shared/redis.service'

export class RoleService {
  constructor(
    private readonly redisService: RedisService,
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly menuRepository: Repository<MenuEntity>,
  ) {}

  public async findList(query: Record<string, string | undefined>) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<RoleEntity> = {}
    if (query.roleName) where.roleName = Like(`%${query.roleName}%`)
    if (query.roleCode) where.roleCode = Like(`%${query.roleCode}%`)
    if (query.status) where.status = query.status
    const [list, total] = await this.roleRepository.findAndCount({
      where,
      relations: { menus: true },
      skip: page.skip,
      take: page.take,
      order: { roleSort: 'ASC' },
    })
    return { list, records: list, total }
  }

  public findAll() {
    return this.roleRepository.find({
      where: { status: CommonConstant.STATUS_NORMAL },
      order: { roleSort: 'ASC' },
    })
  }

  public async findOneById(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { menus: true },
    })
    if (!role) throw new BusinessException('角色不存在')
    return role
  }

  public async create(data: Partial<RoleEntity>) {
    await this.validateRole(data)
    await this.roleRepository.save(this.roleRepository.create(data))
    return '创建成功'
  }

  public async update(data: Partial<RoleEntity>) {
    if (!data.id) throw new BusinessException('角色ID不能为空')
    const role = await this.findOneById(data.id)
    this.checkAdminRole(role)
    await this.validateRole(data, data.id)
    Object.assign(role, data)
    await this.roleRepository.save(role)
    await this.cleanPermissionCacheByRoleIds([role.id])
    return '更新成功'
  }

  public async delete(ids: string) {
    const idList = ids.split(',').filter(Boolean)
    if (!idList.length) throw new BusinessException('角色ID不能为空')
    const roles = await this.roleRepository.find({
      where: { id: In(idList) },
      relations: { users: true, menus: true },
    })
    for (const role of roles) {
      this.checkAdminRole(role)
      if (role.users?.length)
        throw new BusinessException(
          `角色 ${role.roleName} 已分配用户，不能删除`,
        )
      role.menus = []
      await this.roleRepository.save(role)
    }
    await this.roleRepository.delete({ id: In(idList) })
    await this.cleanPermissionCacheByRoleIds(idList)
    return '删除成功'
  }

  public async changeStatus(data: { id: string; status: string }) {
    const role = await this.findOneById(data.id)
    this.checkAdminRole(role)
    await this.roleRepository.update(data.id, { status: data.status })
    await this.cleanPermissionCacheByRoleIds([data.id])
    return '修改成功'
  }

  public async authPermission(data: { roleId: string; menuIds: string[] }) {
    const role = await this.findOneById(data.roleId)
    this.checkAdminRole(role)
    role.menus = data.menuIds?.length
      ? await this.menuRepository.findBy({ id: In(data.menuIds) })
      : []
    await this.roleRepository.save(role)
    await this.cleanPermissionCacheByRoleIds([role.id])
    return '授权成功'
  }

  private async cleanPermissionCacheByRoleIds(roleIds: string[]) {
    if (!roleIds.length) return
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
      relations: { users: true },
    })
    const userIds = [
      ...new Set(
        roles.flatMap((role) => role.users?.map((user) => user.id) ?? []),
      ),
    ]
    const keys = userIds.flatMap((userId) => [
      `${RedisConstant.ADMIN_USER_ROLES}:${userId}`,
      `${RedisConstant.ADMIN_USER_PERMISSIONS}:${userId}`,
    ])
    if (keys.length) await this.redisService.del(...keys)
  }

  private async validateRole(data: Partial<RoleEntity>, id?: string) {
    if (!data.roleName || !data.roleCode)
      throw new BusinessException('角色名称和编码不能为空')
    const where: FindOptionsWhere<RoleEntity> = {
      roleCode: Equal(data.roleCode),
    }
    if (id) where.id = Not(id)
    if (await this.roleRepository.existsBy(where))
      throw new BusinessException(`角色编码 ${data.roleCode} 已存在`)
  }

  private checkAdminRole(role: RoleEntity) {
    if (
      role.id === CommonConstant.ADMIN_ROLE_ID ||
      role.roleCode === CommonConstant.ADMIN_ROLE_CODE
    )
      throw new BusinessException('管理员角色不允许操作')
  }
}
