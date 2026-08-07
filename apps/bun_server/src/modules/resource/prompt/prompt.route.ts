import type { PromptEntity } from '../../../common'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import { registerRouteDefinitions } from '../../../routes/meta'

interface IdQuery {
  id?: string
}
interface IdsQuery {
  ids?: string
}
type Query = Record<string, string | undefined>
type PromptBody = Partial<PromptEntity>

const routes = [
  {
    method: 'GET',
    path: '/resource/prompt/list',
    description: '提示词列表',
    permissions: ['resource:prompt:query'],
    handler: ({ query, services }: RouteContext<unknown, Query>) => services.promptService.findList(query),
  },
  {
    method: 'GET',
    path: '/resource/prompt/detail',
    description: '提示词详情',
    permissions: ['resource:prompt:query'],
    handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.promptService.findOneById(String(query.id ?? '')),
  },
  {
    method: 'POST',
    path: '/resource/prompt/create',
    description: '创建提示词',
    permissions: ['resource:prompt:create'],
    operLog: { title: '提示词管理', businessType: BusinessType.INSERT },
    handler: ({ body, services }: RouteContext<PromptBody>) => services.promptService.create(body),
  },
  {
    method: 'PUT',
    path: '/resource/prompt/update',
    description: '更新提示词',
    permissions: ['resource:prompt:update'],
    operLog: { title: '提示词管理', businessType: BusinessType.UPDATE },
    handler: ({ body, services }: RouteContext<PromptBody>) => services.promptService.update(body),
  },
  {
    method: 'DELETE',
    path: '/resource/prompt/delete',
    description: '删除提示词',
    permissions: ['resource:prompt:delete'],
    operLog: { title: '提示词管理', businessType: BusinessType.DELETE },
    handler: ({ query, services }: RouteContext<unknown, IdsQuery>) => services.promptService.delete(String(query.ids ?? '')),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
