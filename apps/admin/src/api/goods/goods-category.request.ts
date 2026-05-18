import { request } from '@/utils/request'
import type { GoodsCategoryEntity, GoodsCategoryQueryParams } from '@/types'

export abstract class GoodsCategoryRequest {
  static create(data: GoodsCategoryEntity): Promise<string> {
    return request.post('/goods/category/create', data)
  }

  static update(data: GoodsCategoryEntity): Promise<string> {
    return request.put('/goods/category/update', data)
  }

  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/goods/category/delete', { params })
  }

  static findList(params: GoodsCategoryQueryParams): Promise<GoodsCategoryEntity[]> {
    return request.get('/goods/category/list', { params })
  }

  static findDetail(params: { id: string }): Promise<GoodsCategoryEntity> {
    return request.get('/goods/category/detail', { params })
  }

  static findParentList(): Promise<any[]> {
    return request.get('/goods/category/parent')
  }
}