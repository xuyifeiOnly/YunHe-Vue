import type { DictDataEntity, DictTypeEntity } from '../../../common'
import { BusinessType } from '../../../entities/monitor/operlog.entity'
import type { RouteContext } from '../../../core/route-context'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface IdQuery { id?: string }
interface IdsQuery { ids?: string }
interface DictTypeQuery { dictType?: string }
type Query = Record<string, string | undefined>
type DictTypeBody = Partial<DictTypeEntity>
type DictDataBody = Partial<DictDataEntity>

const routes = [
  { method: 'POST', path: '/system/dict/type/create', description: '创建字典类型', permissions: ['system:dict:create'], operLog: { title: '字典管理', businessType: BusinessType.INSERT }, handler: ({ body, services }: RouteContext<DictTypeBody>) => services.dictService.createType(body) },
  { method: 'DELETE', path: '/system/dict/type/delete', description: '删除字典类型', permissions: ['system:dict:delete'], operLog: { title: '字典管理', businessType: BusinessType.DELETE }, handler: ({ query, services }: RouteContext<unknown, IdsQuery>) => services.dictService.deleteType(String(query.ids ?? '')) },
  { method: 'PUT', path: '/system/dict/type/update', description: '更新字典类型', permissions: ['system:dict:update'], operLog: { title: '字典管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<DictTypeBody>) => services.dictService.updateType(body) },
  { method: 'GET', path: '/system/dict/type/list', description: '字典类型列表', permissions: ['system:dict:query'], handler: ({ query, services }: RouteContext<unknown, Query>) => services.dictService.findTypeList(query) },
  { method: 'GET', path: '/system/dict/type/detail', description: '字典类型详情', permissions: ['system:dict:query'], handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.dictService.findTypeDetail(String(query.id ?? '')) },
  { method: 'POST', path: '/system/dict/data/create', description: '创建字典数据', permissions: ['system:dict:create'], operLog: { title: '字典管理', businessType: BusinessType.INSERT }, handler: ({ body, services }: RouteContext<DictDataBody>) => services.dictService.createData(body) },
  { method: 'DELETE', path: '/system/dict/data/delete', description: '删除字典数据', permissions: ['system:dict:delete'], operLog: { title: '字典管理', businessType: BusinessType.DELETE }, handler: ({ query, services }: RouteContext<unknown, IdsQuery>) => services.dictService.deleteData(String(query.ids ?? '')) },
  { method: 'PUT', path: '/system/dict/data/update', description: '更新字典数据', permissions: ['system:dict:update'], operLog: { title: '字典管理', businessType: BusinessType.UPDATE }, handler: ({ body, services }: RouteContext<DictDataBody>) => services.dictService.updateData(body) },
  { method: 'GET', path: '/system/dict/data/list', description: '字典数据列表', permissions: ['system:dict:query'], handler: ({ query, services }: RouteContext<unknown, Query>) => services.dictService.findDataList(query) },
  { method: 'GET', path: '/system/dict/data/detail', description: '字典数据详情', permissions: ['system:dict:query'], handler: ({ query, services }: RouteContext<unknown, IdQuery>) => services.dictService.findDataDetail(String(query.id ?? '')) },
  { method: 'GET', path: '/system/dict/data/list/type', description: '字典类型数据', permissions: ['system:dict:query'], handler: ({ query, services }: RouteContext<unknown, DictTypeQuery>) => services.dictService.findDataByType(String(query.dictType ?? '')) },
  { method: 'DELETE', path: '/system/dict/clearCahche', description: '清理字典缓存', permissions: ['system:dict:delete'], operLog: { title: '字典管理', businessType: BusinessType.DELETE }, handler: ({ services }: RouteContext) => services.dictService.clearCache() },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
