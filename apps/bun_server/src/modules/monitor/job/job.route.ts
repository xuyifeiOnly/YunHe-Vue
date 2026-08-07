import type { JobEntity } from '../../../common'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'
import { idsFrom } from '../utils'

interface IdQuery { id?: string; jobId?: string }
interface IdsBody { ids?: string | string[]; id?: string; jobIds?: string | string[]; logIds?: string | string[] }
interface ChangeStatusBody { id?: string; jobId?: string; status?: string }
interface RunJobBody { id?: string; jobId?: string; jobGroup?: string }
type Query = Record<string, string | undefined>
type JobBody = Partial<JobEntity>

const routes = [
  { method: 'GET', path: '/monitor/job/list', description: '任务列表', permissions: ['monitor:job:query'], handler: ({ query, services }: RouteContext<unknown, Query>) => services.jobService.jobList(query) },
  { method: 'GET', path: '/monitor/job/detail', description: '任务详情', permissions: ['monitor:job:query'], handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.jobService.jobDetail(String(query.jobId ?? query.id ?? '')) },
  { method: 'POST', path: '/monitor/job/create', description: '任务创建', permissions: ['monitor:job:create'], operLog: { title: '定时任务', businessType: BusinessType.INSERT }, handler: ({ body, services }: RouteContext<JobBody>) => services.jobService.createJob(body) },
  { method: 'PUT', path: '/monitor/job/update', description: '任务更新', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<JobBody & { id?: string }>) => services.jobService.updateJob(body) },
  { method: 'PUT', path: '/monitor/job/changeStatus', description: '任务状态', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<ChangeStatusBody>) => services.jobService.changeJobStatus(body) },
  { method: 'POST', path: '/monitor/job/run', description: '任务执行一次', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.OTHER }, handler: ({ body, services }: RouteContext<RunJobBody>) => services.jobService.runJob(body) },
  { method: 'PUT', path: '/monitor/job/run', description: '任务执行一次', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.OTHER }, handler: ({ body, services }: RouteContext<RunJobBody>) => services.jobService.runJob(body) },
  { method: 'DELETE', path: '/monitor/job/delete', description: '任务删除', permissions: ['monitor:job:delete'], operLog: { title: '定时任务', businessType: BusinessType.DELETE }, handler: ({ query, body, services }: RouteContext<IdsBody, IdsBody>) => services.jobService.deleteJob(idsFrom({ ...query, ...body })) },
  { method: 'GET', path: '/monitor/job/log/list', description: '任务日志', permissions: ['monitor:job:query'], handler: ({ query, services }: RouteContext<unknown, Query>) => services.jobService.jobLogList(query) },
  { method: 'DELETE', path: '/monitor/job/log/delete', description: '任务日志删除', permissions: ['monitor:job:delete'], operLog: { title: '任务日志', businessType: BusinessType.DELETE }, handler: ({ query, body, services }: RouteContext<IdsBody, IdsBody>) => services.jobService.deleteJobLog(idsFrom({ ...query, ...body })) },
  { method: 'DELETE', path: '/monitor/job/log/clear', description: '任务日志清空', permissions: ['monitor:job:clear'], operLog: { title: '任务日志', businessType: BusinessType.DELETE }, handler: ({ services }: RouteContext) => services.jobService.clearJobLog() },
  { method: 'GET', path: '/monitor/job/log/export', description: '任务日志导出', permissions: ['monitor:job:export'], operLog: { title: '任务日志', businessType: BusinessType.EXPORT }, handler: ({ query, services }: RouteContext<unknown, Query>) => services.jobService.exportJobLog(query) },
  { method: 'POST', path: '/monitor/job/log/export', description: '任务日志导出', permissions: ['monitor:job:export'], operLog: { title: '任务日志', businessType: BusinessType.EXPORT }, handler: ({ query, services }: RouteContext<unknown, Query>) => services.jobService.exportJobLog(query) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
