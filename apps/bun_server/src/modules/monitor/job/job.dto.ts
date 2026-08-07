import type { PageQuery } from '../../../core/route-context'

/** 任务列表查询 */
export interface JobListQuery extends PageQuery {
  jobName?: string
  jobGroup?: string
  status?: string
}

/** 任务日志列表查询 */
export interface JobLogListQuery extends PageQuery {
  jobName?: string
  jobGroup?: string
  status?: string
}

/** 创建任务 */
export interface CreateJobBody {
  jobName: string
  jobGroup?: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy?: string
  concurrent?: string
  status?: string
}

/** 更新任务 */
export interface UpdateJobBody extends Partial<CreateJobBody> {
  id: string
}

/** 修改任务状态 */
export interface ChangeJobStatusBody {
  id?: string
  jobId?: string
  status?: string
}

/** 立即执行一次任务 */
export interface RunJobBody {
  id?: string
  jobId?: string
  jobGroup?: string
}
