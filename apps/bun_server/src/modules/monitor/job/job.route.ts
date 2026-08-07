import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { IdsPayload, RouteContext } from '../../../core/route-context'
import { idsFrom } from '../../../core/validation'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'
import type {
  ChangeJobStatusBody,
  CreateJobBody,
  JobListQuery,
  JobLogListQuery,
  RunJobBody,
  UpdateJobBody,
} from './job.dto'

const routes = [
  { method: 'GET', path: '/monitor/job/list', description: '任务列表', permissions: ['monitor:job:query'], handler: ({ query, services }) => services.jobService.jobList(query as JobListQuery) },
  { method: 'GET', path: '/monitor/job/detail', description: '任务详情', permissions: ['monitor:job:query'], handler: ({ query, services }) => services.jobService.jobDetail(String((query as { id?: string; jobId?: string }).jobId ?? (query as { id?: string; jobId?: string }).id ?? '')) },
  { method: 'POST', path: '/monitor/job/create', description: '任务创建', permissions: ['monitor:job:create'], operLog: { title: '定时任务', businessType: BusinessType.INSERT }, handler: ({ body, services }) => services.jobService.createJob(body as CreateJobBody) },
  { method: 'PUT', path: '/monitor/job/update', description: '任务更新', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.UPDATE }, handler: ({ body, services }) => services.jobService.updateJob(body as UpdateJobBody) },
  { method: 'PUT', path: '/monitor/job/changeStatus', description: '任务状态', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.UPDATE }, handler: ({ body, services }) => services.jobService.changeJobStatus(body as ChangeJobStatusBody) },
  { method: 'POST', path: '/monitor/job/run', description: '任务执行一次', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.OTHER }, handler: ({ body, services }) => services.jobService.runJob(body as RunJobBody) },
  { method: 'PUT', path: '/monitor/job/run', description: '任务执行一次', permissions: ['monitor:job:update'], operLog: { title: '定时任务', businessType: BusinessType.OTHER }, handler: ({ body, services }) => services.jobService.runJob(body as RunJobBody) },
  { method: 'DELETE', path: '/monitor/job/delete', description: '任务删除', permissions: ['monitor:job:delete'], operLog: { title: '定时任务', businessType: BusinessType.DELETE }, handler: ({ query, body, services }: RouteContext<IdsPayload, IdsPayload>) => services.jobService.deleteJob(idsFrom({ ...query, ...body })) },
  { method: 'GET', path: '/monitor/job/log/list', description: '任务日志', permissions: ['monitor:job:query'], handler: ({ query, services }) => services.jobService.jobLogList(query as JobLogListQuery) },
  { method: 'DELETE', path: '/monitor/job/log/delete', description: '任务日志删除', permissions: ['monitor:job:delete'], operLog: { title: '任务日志', businessType: BusinessType.DELETE }, handler: ({ query, body, services }: RouteContext<IdsPayload, IdsPayload>) => services.jobService.deleteJobLog(idsFrom({ ...query, ...body })) },
  { method: 'DELETE', path: '/monitor/job/log/clear', description: '任务日志清空', permissions: ['monitor:job:clear'], operLog: { title: '任务日志', businessType: BusinessType.DELETE }, handler: ({ services }) => services.jobService.clearJobLog() },
  { method: 'GET', path: '/monitor/job/log/export', description: '任务日志导出', permissions: ['monitor:job:export'], operLog: { title: '任务日志', businessType: BusinessType.EXPORT }, handler: ({ query, services }) => services.jobService.exportJobLog(query as JobLogListQuery) },
  { method: 'POST', path: '/monitor/job/log/export', description: '任务日志导出', permissions: ['monitor:job:export'], operLog: { title: '任务日志', businessType: BusinessType.EXPORT }, handler: ({ query, services }) => services.jobService.exportJobLog(query as JobLogListQuery) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
