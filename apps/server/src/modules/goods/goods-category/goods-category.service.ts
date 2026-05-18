import { listToTree } from '@/utils'
import { Injectable } from '@nestjs/common'
import { Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { BusinessException, CommonConstant, GoodsCategoryEntity } from '@/common'
import { CreateGoodsCategoryDto, QueryGoodsCategoryDto, UpdateGoodsCategoryDto } from './goods-category.dto'

@Injectable()
export class GoodsCategoryService {
  constructor(@InjectRepository(GoodsCategoryEntity) private readonly goodsCategoryRepository: Repository<GoodsCategoryEntity>) {}

  public async create(createDto: CreateGoodsCategoryDto) {
    const { name, parentId } = createDto
    const exists = await this.goodsCategoryRepository.existsBy({ name: Equal(name), parentId: Equal(parentId || CommonConstant.DEFAULT_PARENT_ID) })
    if (exists) throw new BusinessException('同级分类名称已存在')
    const entity = new GoodsCategoryEntity()
    Object.assign(entity, createDto)
    await this.goodsCategoryRepository.save(entity)
    return '添加成功'
  }

  public async update(updateDto: UpdateGoodsCategoryDto) {
    const { id, name, parentId } = updateDto
    const exist = await this.goodsCategoryRepository.findOneBy({ id: Equal(id) })
    if (!exist) throw new BusinessException('分类不存在')
    if (name && (name !== exist.name || parentId !== exist.parentId)) {
      const exists = await this.goodsCategoryRepository.existsBy({
        name: Equal(name),
        parentId: Equal(parentId || exist.parentId),
        id: Not(id),
      })
      if (exists) throw new BusinessException('同级分类名称已存在')
    }
    Object.assign(exist, updateDto)
    await this.goodsCategoryRepository.save(exist)
    return '修改成功'
  }

  public async delete(ids: string[]) {
    const list = await this.goodsCategoryRepository.findBy({ id: In(ids) })
    if (!list.length) throw new BusinessException('分类不存在')
    for (const id of ids) {
      const hasChild = await this.goodsCategoryRepository.existsBy({ parentId: Equal(id) })
      if (hasChild) throw new BusinessException('存在子分类，无法删除')
    }
    await this.goodsCategoryRepository.delete(ids)
    return '删除成功'
  }

  public async findList(queryParams: QueryGoodsCategoryDto) {
    const { name, status } = queryParams
    const queryBuilder = this.goodsCategoryRepository.createQueryBuilder('goods_category')
    const where: FindOptionsWhere<GoodsCategoryEntity> = {}
    if (name) where.name = Like(`%${name}%`)
    if (status) where.status = Equal(status)
    queryBuilder.where(where)
    queryBuilder.orderBy('goods_category.sort', 'ASC')
    queryBuilder.addOrderBy('goods_category.createTime', 'DESC')
    const records = await queryBuilder.getMany()
    return listToTree(records)
  }

  public async findOneById(id: string) {
    const data = await this.goodsCategoryRepository.findOneBy({ id: Equal(id) })
    if (!data) throw new BusinessException('分类不存在')
    return data
  }

  public async findParentList() {
    const queryBuilder = this.goodsCategoryRepository.createQueryBuilder('goods_category')
    queryBuilder.andWhere('goods_category.status = :status', { status: CommonConstant.STATUS_NORMAL })
    queryBuilder.orderBy('goods_category.sort', 'ASC')
    const records = await queryBuilder.getMany()
    return [{ parentId: CommonConstant.DEFAULT_PARENT_ID, id: '0', name: '顶级分类', children: listToTree(records) }]
  }
}