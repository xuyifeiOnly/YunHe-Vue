import { Equal, In, Like, Not, type FindOptionsWhere, type Repository } from 'typeorm'
import { BusinessException, CommonConstant, DictDataEntity, DictTypeEntity, RedisConstant } from '../../../common'
import type { RedisService } from '../../../shared/redis.service'
import { parsePagination } from '../../../core/validation'

export class DictService {
  constructor(
    private readonly redisService: RedisService,
    private readonly dictTypeRepository: Repository<DictTypeEntity>,
    private readonly dictDataRepository: Repository<DictDataEntity>,
  ) {}

  public async findTypeList(query: Record<string, string | undefined>) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<DictTypeEntity> = {}
    if (query.dictName) where.dictName = Like(`%${query.dictName}%`)
    if (query.dictType) where.dictType = Like(`%${query.dictType}%`)
    if (query.status) where.status = query.status
    const [list, total] = await this.dictTypeRepository.findAndCount({ where, skip: page.skip, take: page.take, order: { createTime: 'DESC' } })
    return { list, records: list, total }
  }

  public async findTypeDetail(id: string) {
    const data = await this.dictTypeRepository.findOneBy({ id })
    if (!data) throw new BusinessException('字典类型不存在')
    return data
  }

  public async createType(data: Partial<DictTypeEntity>) {
    await this.validateType(data)
    await this.dictTypeRepository.save(this.dictTypeRepository.create(data))
    await this.clearCache()
    return '创建成功'
  }

  public async updateType(data: Partial<DictTypeEntity>) {
    if (!data.id) throw new BusinessException('字典类型ID不能为空')
    await this.validateType(data, data.id)
    const oldType = await this.findTypeDetail(data.id)
    await this.dictTypeRepository.update(data.id, data)
    if (data.dictType && data.dictType !== oldType.dictType) await this.dictDataRepository.update({ dictType: oldType.dictType }, { dictType: data.dictType })
    await this.clearCache()
    return '更新成功'
  }

  public async deleteType(ids: string) {
    const idList = ids.split(',').filter(Boolean)
    if (!idList.length) throw new BusinessException('字典类型ID不能为空')
    const types = await this.dictTypeRepository.findBy({ id: In(idList) })
    for (const type of types) {
      const count = await this.dictDataRepository.countBy({ dictType: type.dictType })
      if (count > 0) throw new BusinessException(`字典类型 ${type.dictName} 已分配字典数据，不能删除`)
    }
    await this.dictTypeRepository.delete({ id: In(idList) })
    await this.clearCache()
    return '删除成功'
  }

  public async findDataList(query: Record<string, string | undefined>) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<DictDataEntity> = {}
    if (query.dictType) where.dictType = query.dictType
    if (query.dictLabel) where.dictLabel = Like(`%${query.dictLabel}%`)
    if (query.status) where.status = query.status
    const [list, total] = await this.dictDataRepository.findAndCount({ where, skip: page.skip, take: page.take, order: { dictSort: 'ASC' } })
    return { list, records: list, total }
  }

  public async findDataDetail(id: string) {
    const data = await this.dictDataRepository.findOneBy({ id })
    if (!data) throw new BusinessException('字典数据不存在')
    return data
  }

  public async findDataByType(dictType: string) {
    if (!dictType) return []
    const cacheKey = `${RedisConstant.DICTTYPE_KEY}:${dictType}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) return JSON.parse(cached) as DictDataEntity[]
    const list = await this.dictDataRepository.find({ where: { dictType, status: CommonConstant.STATUS_NORMAL }, order: { dictSort: 'ASC' } })
    await this.redisService.set(cacheKey, JSON.stringify(list), 'EX', 3600)
    return list
  }

  public async createData(data: Partial<DictDataEntity>) {
    await this.validateData(data)
    await this.dictDataRepository.save(this.dictDataRepository.create(data))
    await this.clearCache(data.dictType!)
    return '创建成功'
  }

  public async updateData(data: Partial<DictDataEntity>) {
    if (!data.id) throw new BusinessException('字典数据ID不能为空')
    const oldData = await this.findDataDetail(data.id)
    await this.validateData(data)
    await this.dictDataRepository.update(data.id, data)
    await this.clearCache(oldData.dictType)
    if (data.dictType && data.dictType !== oldData.dictType) await this.clearCache(data.dictType)
    return '更新成功'
  }

  public async deleteData(ids: string) {
    const idList = ids.split(',').filter(Boolean)
    if (!idList.length) throw new BusinessException('字典数据ID不能为空')
    const list = await this.dictDataRepository.findBy({ id: In(idList) })
    await this.dictDataRepository.delete({ id: In(idList) })
    await this.clearCache(...new Set(list.map((item) => item.dictType)))
    return '删除成功'
  }

  public async clearCache(...dictTypes: string[]) {
    const patterns = dictTypes.length ? dictTypes.map((type) => `${RedisConstant.DICTTYPE_KEY}:${type}`) : [`${RedisConstant.DICTTYPE_KEY}:*`]
    const keys = (await Promise.all(patterns.map((pattern) => this.redisService.scanKeys(pattern)))).flat()
    if (keys.length) await this.redisService.del(...keys)
    return '清理成功'
  }

  private async validateType(data: Partial<DictTypeEntity>, id?: string) {
    if (!data.dictName || !data.dictType) throw new BusinessException('字典名称和类型不能为空')
    const where: FindOptionsWhere<DictTypeEntity> = { dictType: Equal(data.dictType) }
    if (id) where.id = Not(id)
    if (await this.dictTypeRepository.existsBy(where)) throw new BusinessException(`字典类型 ${data.dictType} 已存在`)
  }

  private async validateData(data: Partial<DictDataEntity>) {
    if (!data.dictType || !data.dictLabel || data.dictValue === undefined || data.dictValue === null) throw new BusinessException('字典类型、标签和值不能为空')
    const type = await this.dictTypeRepository.findOneBy({ dictType: data.dictType })
    if (!type) throw new BusinessException(`字典类型 ${data.dictType} 不存在`)
  }
}
