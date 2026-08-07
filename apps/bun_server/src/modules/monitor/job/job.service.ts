import { Queue, QueueEvents, Worker, type JobsOptions } from 'bullmq'
import { Equal, Like, Not, type FindOptionsWhere, type Repository } from 'typeorm'
import { BusinessException, CommonConstant, JobEntity, JobLogEntity } from '../../../common'
import type { AppConfig } from '../../../config/config'
import { parsePagination } from '../../../core/validation'
import { formatTime, logInfo } from '../../../utils'
import type { ExcelService } from '../../common/excel/excel.service'
import type { QueryParams } from '../utils'

type JobCallable = (...args: unknown[]) => unknown
type JobServiceTarget = Record<string, JobCallable | unknown>
type RegisteredJobService = { service: JobServiceTarget; methods: Set<string> }
type InvokeResult = { serviceName: string; funName: string; argumentsArray: unknown[]; service: JobServiceTarget }
const EXPORT_LIMIT = 5000

export class JobService {
  private readonly queue: Queue<JobEntity>
  private readonly worker: Worker<JobEntity>
  private readonly queueEvents: QueueEvents
  public readonly serviceMap = new Map<string, RegisteredJobService>()

  constructor(
    private readonly config: AppConfig,
    private readonly excelService: ExcelService,
    private readonly jobRepository: Repository<JobEntity>,
    private readonly jobLogRepository: Repository<JobLogEntity>,
  ) {
    this.queue = new Queue('yunhe-job', { connection: config.redis })
    this.queueEvents = new QueueEvents('yunhe-job', { connection: config.redis })
    this.worker = new Worker('yunhe-job', (job) => this.processJob(job.data), { connection: config.redis })
    this.worker.on('completed', async (job) => this.createJobLog(job.data, '执行成功', CommonConstant.STATUS_NORMAL))
    this.worker.on('failed', async (job, error) => {
      if (job?.data) await this.createJobLog(job.data, error.message || '执行定时任务失败', CommonConstant.STATUS_DISABLE)
    })
    this.registerService('JobService', this as unknown as JobServiceTarget, ['test'])
  }

  public registerService(name: string, service: JobServiceTarget, methods?: string[]): void
  public registerService(services: Record<string, JobServiceTarget | { service: JobServiceTarget; methods?: string[] }>): void
  public registerService(nameOrServices: string | Record<string, JobServiceTarget | { service: JobServiceTarget; methods?: string[] }>, service?: JobServiceTarget, methods?: string[]) {
    if (typeof nameOrServices === 'string') {
      if (service) this.serviceMap.set(nameOrServices, this.createRegisteredService(service, methods))
      return
    }
    Object.entries(nameOrServices).forEach(([name, item]) => {
      if (this.isRegisteredServiceConfig(item)) this.serviceMap.set(name, this.createRegisteredService(item.service, item.methods))
      else this.serviceMap.set(name, this.createRegisteredService(item))
    })
  }

  public async initJobs() {
    const repeatableJobs = await ((this.queue as any).getRepeatableJobs?.() ?? Promise.resolve([])).catch(() => [])
    await Promise.all(repeatableJobs.map((item: { key: string }) => (this.queue as any).removeRepeatableByKey?.(item.key)?.catch(() => undefined)))
    const schedulers = await this.queue.getJobSchedulers().catch(() => [])
    await Promise.all(schedulers.map((item) => this.queue.removeJobScheduler(item.key).catch(() => undefined)))
    await this.queue.clean(0, 1000, 'delayed').catch(() => [])
    const { records } = await this.jobList({ status: CommonConstant.STATUS_NORMAL, pageNo: '1', pageSize: '1000' })
    await Promise.all(records.map((job) => this.startJob(job)))
  }

  public test = () => {
    logInfo(`test ${process.pid} ${formatTime()}`)
  }

  public async createJob(data: Partial<JobEntity>) {
    if (!data.jobName || !data.invokeTarget || !data.cronExpression) throw new BusinessException('参数不完整')
    const exists = await this.jobRepository.exists({ where: { jobName: data.jobName } })
    if (exists) throw new BusinessException(`任务名称 ${data.jobName} 已存在`)
    await this.analysisInvokeTarget(data.invokeTarget)
    this.validateCronExpression(data.cronExpression)
    const job = this.jobRepository.create(data)
    const saved = await this.jobRepository.save(job)
    if (saved.status === CommonConstant.STATUS_NORMAL) await this.startJob(saved)
    return '添加成功'
  }

  public async updateJob(data: Partial<JobEntity> & { id?: string }) {
    if (!data.id) throw new BusinessException('任务不存在')
    const job = await this.jobRepository.findOneBy({ id: data.id })
    if (!job) throw new BusinessException('任务不存在')
    if (data.jobName) {
      const exists = await this.jobRepository.existsBy({ jobName: data.jobName, id: Not(data.id) })
      if (exists) throw new BusinessException(`任务名称 ${data.jobName} 已存在`)
    }
    if (data.invokeTarget) await this.analysisInvokeTarget(data.invokeTarget)
    if (data.cronExpression) this.validateCronExpression(data.cronExpression)
    await this.stopJob(job.id)
    Object.assign(job, data)
    const saved = await this.jobRepository.save(job)
    if (saved.status === CommonConstant.STATUS_NORMAL) await this.startJob(saved)
    return '更新成功'
  }

  public async jobList(query: QueryParams) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<JobEntity> = {}
    if (query.jobName) where.jobName = Like(`%${query.jobName}%`)
    if (query.jobGroup) where.jobGroup = Like(`%${query.jobGroup}%`)
    if (query.status) where.status = Equal(query.status)
    const [records, total] = await this.jobRepository.findAndCount({ where, skip: page.skip, take: page.take, order: { createTime: 'ASC' } })
    return { records, list: records, total }
  }

  public jobDetail(jobId: string) {
    return this.jobRepository.findOne({ where: { id: jobId } })
  }

  public async changeJobStatus(data: { id?: string; jobId?: string; status?: string }) {
    const id = data.id ?? data.jobId
    if (!id || !data.status) throw new BusinessException('参数不完整')
    const job = await this.jobRepository.findOneBy({ id })
    if (!job) throw new BusinessException('任务不存在')
    await this.stopJob(id)
    job.status = data.status
    await this.jobRepository.save(job)
    if (data.status === CommonConstant.STATUS_NORMAL) await this.startJob(job)
    return '状态修改成功'
  }

  public async runJob(data: { jobId?: string; id?: string; jobGroup?: string }) {
    const id = data.jobId ?? data.id
    if (!id) throw new BusinessException('任务不存在')
    const where: FindOptionsWhere<JobEntity> = { id: Equal(id) }
    if (data.jobGroup) where.jobGroup = Equal(data.jobGroup)
    const job = await this.jobRepository.findOne({ where })
    if (!job) throw new BusinessException('任务不存在')
    await this.analysisInvokeTarget(job.invokeTarget)
    await this.onceJob(job)
    return '执行一次成功'
  }

  public async deleteJob(ids: string[]) {
    if (!ids.length) throw new BusinessException('请选择要删除的任务')
    for (const id of ids) await this.stopJob(id)
    await this.jobRepository.delete(ids)
    return '删除成功'
  }

  public async jobLogList(query: QueryParams) {
    const page = parsePagination(query)
    const where = this.createJobLogWhere(query)
    const [records, total] = await this.jobLogRepository.findAndCount({ where, skip: page.skip, take: page.take, order: { createTime: 'DESC' } })
    return { records, list: records, total }
  }

  public async deleteJobLog(ids: string[]) {
    if (ids.length) await this.jobLogRepository.delete(ids)
    return '删除成功'
  }

  public async clearJobLog() {
    await this.jobLogRepository.clear()
    return '清空成功'
  }

  public async exportJobLog(query: QueryParams = {}) {
    const where = this.createJobLogWhere(query)
    const records = await this.jobLogRepository.find({ where, order: { createTime: 'DESC' }, take: EXPORT_LIMIT })
    return this.excelService.exportResponse(records as unknown as Record<string, unknown>[], `任务调度日志-${Date.now()}.xlsx`, 'joblog')
  }

  public async addJob(data: { name?: string; data?: unknown }) {
    await this.queue.add(data.name ?? 'default', data.data as JobEntity)
    return '任务已加入队列'
  }

  public async analysisInvokeTarget(invokeTarget?: string): Promise<InvokeResult> {
    if (!invokeTarget) throw new BusinessException('调用方法格式错误')
    const match = invokeTarget.match(/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\((.*)\)$/)
    if (!match) throw new BusinessException('调用方法格式错误')
    const [, serviceName, funName, argsStr] = match
    const registered = this.serviceMap.get(serviceName)
    if (!registered || !registered.methods.has(funName)) throw new BusinessException('调用方法未找到')
    const target = registered.service[funName]
    if (typeof target !== 'function') throw new BusinessException('调用方法未找到')
    let argumentsArray: unknown[] = []
    if (argsStr.trim()) {
      try {
        argumentsArray = JSON.parse(`[${argsStr.replace(/'/g, '"')}]`)
      } catch {
        throw new BusinessException('参数格式错误，请使用合法JSON格式')
      }
    }
    return { serviceName, funName, argumentsArray, service: registered.service }
  }

  private async processJob(job: JobEntity) {
    const { service, funName, argumentsArray } = await this.analysisInvokeTarget(job.invokeTarget)
    const method = service[funName]
    if (typeof method !== 'function') throw new BusinessException('调用方法未找到')
    const result = method(...argumentsArray)
    if (job.concurrent === CommonConstant.STATUS_NORMAL) void Promise.resolve(result)
    else await result
  }

  private async createJobLog(data: JobEntity, message: string, status: string) {
    const jobLog = new JobLogEntity()
    jobLog.jobName = data.jobName
    jobLog.jobGroup = data.jobGroup
    jobLog.invokeTarget = data.invokeTarget
    jobLog.jobMessage = message
    jobLog.status = status
    jobLog.createTime = formatTime()
    await this.jobLogRepository.save(jobLog)
  }

  private async startJob(job: JobEntity) {
    this.validateCronExpression(job.cronExpression)
    const existing = await this.queue.getJobScheduler(job.id).catch(() => null)
    if (existing) await this.queue.removeJobScheduler(job.id)
    if (job.misfirePolicy === '1') await this.onceJob(job)
    const immediately = job.misfirePolicy !== '3'
    await this.queue.upsertJobScheduler(job.id, { pattern: job.cronExpression, immediately }, { name: job.jobName, data: job, opts: { removeOnComplete: true, removeOnFail: true } })
  }

  private async stopJob(jobId: string) {
    const existing = await this.queue.getJobScheduler(jobId).catch(() => null)
    if (existing) await this.queue.removeJobScheduler(jobId)
  }

  private async onceJob(job: JobEntity) {
    const existing = await this.queue.getJob(job.id)
    if (existing) await existing.remove()
    const options: JobsOptions = { jobId: job.id, removeOnComplete: true, removeOnFail: false }
    await this.queue.add(job.jobName, job, options)
  }

  private createRegisteredService(service: JobServiceTarget, methods?: string[]): RegisteredJobService {
    const methodList = methods ?? Object.entries(service).filter(([, value]) => typeof value === 'function').map(([key]) => key)
    return { service, methods: new Set(methodList) }
  }

  private isRegisteredServiceConfig(value: JobServiceTarget | { service: JobServiceTarget; methods?: string[] }): value is { service: JobServiceTarget; methods?: string[] } {
    return 'service' in value && typeof value.service === 'object'
  }

  private createJobLogWhere(query: QueryParams) {
    const where: FindOptionsWhere<JobLogEntity> = {}
    if (query.jobName) where.jobName = Like(`%${query.jobName}%`)
    if (query.jobGroup) where.jobGroup = Like(`%${query.jobGroup}%`)
    if (query.status) where.status = Equal(query.status)
    return where
  }

  private validateCronExpression(cronExpression?: string) {
    if (!cronExpression) throw new BusinessException('Cron 表达式不能为空')
    const parts = cronExpression.trim().split(/\s+/)
    if (![5, 6].includes(parts.length)) throw new BusinessException('Cron 表达式格式错误')
    const valid = parts.every((part) => /^[\d*/?,\-LW#]+$|^[A-Z]{3}(?:-[A-Z]{3})?$/.test(part.toUpperCase()))
    if (!valid) throw new BusinessException('Cron 表达式格式错误')
  }
}

export function parseInvokeTarget(invokeTarget: string) {
  const match = invokeTarget.match(/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\((.*)\)$/)
  if (!match) throw new BusinessException('调用方法格式错误')
  const [, serviceName, funName, argsStr] = match
  return { serviceName, funName, argsStr }
}
