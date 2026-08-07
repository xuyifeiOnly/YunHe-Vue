import { Equal, Like, Not, type FindOptionsWhere, type Repository } from 'typeorm'
import { BusinessException, CommonConstant, MenuEntity, RedisConstant } from '../../../common'
import { listToTree } from '../../../utils'
import type { RedisService } from '../../../shared/redis.service'

export class MenuService {
  constructor(
    private readonly redisService: RedisService,
    private readonly menuRepository: Repository<MenuEntity>,
  ) {}

  public async findRoutesByRoleIds(roleIds: string[], isAdmin: boolean) {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.menuType != :menuType', { menuType: 'F' })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    if (!isAdmin) {
      if (!roleIds.length) return []
      queryBuilder.innerJoin('menu.roles', 'role')
      queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds })
    }
    queryBuilder.distinct(true)
    queryBuilder.orderBy('menu.menuSort', 'ASC')
    return queryBuilder.getMany()
  }

  public async findPermissionsByRoleIds(roleIds: string[], isAdmin: boolean): Promise<string[]> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.menuType = :menuType', { menuType: 'F' })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    if (!isAdmin) {
      if (!roleIds.length) return []
      queryBuilder.innerJoin('menu.roles', 'role')
      queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds })
    }
    queryBuilder.distinct(true)
    const permissionMenuList = await queryBuilder.getMany()
    return permissionMenuList.map((menu) => menu.permission).filter(Boolean)
  }

  public async findList(queryParams: { status?: string; menuName?: string; menuType?: string }) {
    const where: FindOptionsWhere<MenuEntity> = {}
    if (queryParams.menuName) where.menuName = Like(`%${queryParams.menuName}%`)
    if (queryParams.menuType) where.menuType = queryParams.menuType
    if (queryParams.status) where.status = queryParams.status
    const list = await this.menuRepository.find({ where, order: { menuSort: 'ASC' } })
    return listToTree(list)
  }

  public async findParentList() {
    const menus = await this.menuRepository.find({ where: { menuType: Not(Equal('F')), status: CommonConstant.STATUS_NORMAL }, order: { menuSort: 'ASC' } })
    return listToTree(menus)
  }

  public async findListByRoleId(roleId: string) {
    if (!roleId) return []
    return this.menuRepository.createQueryBuilder('menu').innerJoin('menu.roles', 'role').where('role.id = :roleId', { roleId }).orderBy('menu.menuSort', 'ASC').getMany()
  }

  public async findOneById(id: string) {
    const menu = await this.menuRepository.findOneBy({ id })
    if (!menu) throw new BusinessException('菜单不存在')
    return menu
  }

  public async create(data: Partial<MenuEntity>) {
    await this.validateMenu(data)
    await this.menuRepository.save(this.menuRepository.create(data))
    await this.cleanAllPermissionCache()
    return '创建成功'
  }

  public async update(data: Partial<MenuEntity>) {
    if (!data.id) throw new BusinessException('菜单ID不能为空')
    await this.findOneById(data.id)
    await this.validateMenu(data, data.id)
    await this.menuRepository.update(data.id, data)
    await this.cleanAllPermissionCache()
    return '更新成功'
  }

  public async delete(id: string) {
    if (!id) throw new BusinessException('菜单ID不能为空')
    const children = await this.menuRepository.countBy({ parentId: id })
    if (children > 0) throw new BusinessException('存在子菜单，不允许删除')
    const menu = await this.menuRepository.findOne({ where: { id }, relations: { roles: true } })
    if (menu?.roles?.length) {
      menu.roles = []
      await this.menuRepository.save(menu)
    }
    await this.menuRepository.delete({ id })
    await this.cleanAllPermissionCache()
    return '删除成功'
  }

  private async cleanAllPermissionCache() {
    const keys = await this.redisService.scanKeys(`${RedisConstant.ADMIN_USER_PERMISSIONS}:*`)
    if (keys.length) await this.redisService.del(...keys)
  }

  private async validateMenu(data: Partial<MenuEntity>, id?: string) {
    if (!data.menuName || !data.menuType) throw new BusinessException('菜单名称和类型不能为空')
    if (data.parentId && data.parentId !== CommonConstant.DEFAULT_PARENT_ID) {
      const parent = await this.menuRepository.findOneBy({ id: data.parentId })
      if (!parent) throw new BusinessException('父级菜单不存在')
      if (parent.menuType === 'F') throw new BusinessException('父级菜单不能为按钮')
      if (id && data.parentId === id) throw new BusinessException('父级菜单不能为当前菜单')
    }
    if (data.path) {
      const where: FindOptionsWhere<MenuEntity> = { path: Equal(data.path) }
      if (id) where.id = Not(id)
      if (await this.menuRepository.existsBy(where)) throw new BusinessException(`路由地址 ${data.path} 已存在`)
    }
    if (data.permission) {
      const where: FindOptionsWhere<MenuEntity> = { permission: Equal(data.permission) }
      if (id) where.id = Not(id)
      if (await this.menuRepository.existsBy(where)) throw new BusinessException(`权限字符 ${data.permission} 已存在`)
    }
  }
}
