import { Equal, Like, type FindOptionsWhere, type Repository } from 'typeorm'
import { LogininforEntity, OperLogEntity } from '../../../common'
import { parsePagination } from '../../../core/validation'
import type { ExcelService } from '../../common/excel/excel.service'
import type { QueryParams } from '../utils'

const EXPORT_LIMIT = 5000

export class LogService {
  constructor(
    private readonly excelService: ExcelService,
    private readonly logininforRepository: Repository<LogininforEntity>,
    private readonly operRepository: Repository<OperLogEntity>,
  ) {}

  public async createLogininfor(data: Partial<LogininforEntity>) {
    const logininfor = this.logininforRepository.create(data)
    return this.logininforRepository.save(logininfor)
  }

  public async logininforList(query: QueryParams) {
    const page = parsePagination(query)
    const where = this.createLogininforWhere(query)
    const [records, total] = await this.logininforRepository.findAndCount({
      where,
      skip: page.skip,
      take: page.take,
      order: { loginTime: 'DESC' },
    })
    return { records, list: records, total }
  }

  public async deleteLogininfor(ids: string[]) {
    if (ids.length) await this.logininforRepository.delete(ids)
    return '删除成功'
  }

  public async clearLogininfor() {
    await this.logininforRepository.clear()
    return '清空成功'
  }

  public async exportLogininfor(query: QueryParams = {}) {
    const where = this.createLogininforWhere(query)
    const records = await this.logininforRepository.find({
      where,
      order: { loginTime: 'DESC' },
      take: EXPORT_LIMIT,
    })
    return this.excelService.exportResponse(
      records as unknown as Record<string, unknown>[],
      `登录日志-${Date.now()}.xlsx`,
      'logininfor',
    )
  }

  public async operlogList(query: QueryParams) {
    const page = parsePagination(query)
    const where = this.createOperlogWhere(query)
    const [records, total] = await this.operRepository.findAndCount({
      where,
      skip: page.skip,
      take: page.take,
      order: { operTime: 'DESC' },
    })
    return { records, list: records, total }
  }

  public async deleteOperlog(ids: string[]) {
    if (ids.length) await this.operRepository.delete(ids)
    return '删除成功'
  }

  public async clearOperlog() {
    await this.operRepository.clear()
    return '清空成功'
  }

  public async exportOperlog(query: QueryParams = {}) {
    const where = this.createOperlogWhere(query)
    const records = await this.operRepository.find({
      where,
      order: { operTime: 'DESC' },
      take: EXPORT_LIMIT,
    })
    return this.excelService.exportResponse(
      records as unknown as Record<string, unknown>[],
      `操作日志-${Date.now()}.xlsx`,
      'operlog',
    )
  }

  public createOperlog(data: Partial<OperLogEntity>) {
    return this.operRepository.save(this.operRepository.create(data))
  }

  public logList() {
    return this.operlogList({})
  }

  private createLogininforWhere(query: QueryParams) {
    const where: FindOptionsWhere<LogininforEntity> = {}
    if (query.ip) where.ip = Like(`%${query.ip}%`)
    if (query.username) where.username = Like(`%${query.username}%`)
    if (query.location) where.location = Like(`%${query.location}%`)
    if (query.status) where.status = Equal(query.status)
    return where
  }

  private createOperlogWhere(query: QueryParams) {
    const where: FindOptionsWhere<OperLogEntity> = {}
    if (query.ip) where.ip = Like(`%${query.ip}%`)
    if (query.title) where.title = Like(`%${query.title}%`)
    if (query.username) where.username = Like(`%${query.username}%`)
    if (query.location) where.location = Like(`%${query.location}%`)
    if (query.status) where.status = Equal(query.status)
    return where
  }
}
