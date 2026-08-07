import { BusinessException } from '../common'
import type { IdsPayload } from './route-context'

export interface PaginationOptions {
  maxPageSize?: number
  defaultPageSize?: number
}

export interface PaginationResult {
  pageNo: number
  pageNum: number
  pageSize: number
  skip: number
  take: number
}

/** 通用分页响应结构 */
export interface PageResult<T> {
  list: T[]
  records: T[]
  total: number
}

/** 构造统一的分页响应，避免 list/records 字段缺失 */
export function pageResult<T>(records: T[], total: number): PageResult<T> {
  return { list: records, records, total }
}

export function parsePositiveInt(value: unknown, fieldName: string, defaultValue?: number): number {
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) return defaultValue
    throw new BusinessException(`${fieldName}不能为空`)
  }
  const numberValue = Number(value)
  if (!Number.isInteger(numberValue) || numberValue <= 0) throw new BusinessException(`${fieldName}必须为正整数`)
  return numberValue
}

export function assertRecord(value: unknown, fieldName = '参数'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BusinessException(`${fieldName}必须为对象`)
  return value as Record<string, unknown>
}

export function parseString(value: unknown, fieldName: string, options: { required?: boolean; max?: number } = {}): string {
  if (value === undefined || value === null || value === '') {
    if (options.required) throw new BusinessException(`${fieldName}不能为空`)
    return ''
  }
  if (typeof value !== 'string') throw new BusinessException(`${fieldName}必须为字符串`)
  const result = value.trim()
  if (options.required && !result) throw new BusinessException(`${fieldName}不能为空`)
  if (options.max !== undefined && result.length > options.max) throw new BusinessException(`${fieldName}长度不能超过${options.max}个字符`)
  return result
}

export function parseBoolean(value: unknown, fieldName: string, defaultValue = false): boolean {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new BusinessException(`${fieldName}必须为布尔值`)
}

export function parsePagination(query: object = {}, options: PaginationOptions = {}): PaginationResult {
  const q = query as Record<string, unknown>
  const defaultPageSize = options.defaultPageSize ?? 10
  const maxPageSize = options.maxPageSize ?? 1000
  const pageNo = parsePositiveInt(q.pageNo ?? q.pageNum, '页码', 1)
  const pageSize = parsePositiveInt(q.pageSize, '每页条数', defaultPageSize)
  if (pageSize > maxPageSize) throw new BusinessException(`每页条数不能超过${maxPageSize}`)
  return { pageNo, pageNum: pageNo, pageSize, skip: (pageNo - 1) * pageSize, take: pageSize }
}

/**
 * 解析逗号分隔的 ID 字符串或 ID 数组。
 * - 空字符串、undefined 返回空数组或抛错由 required 控制
 */
export function parseIds(value: unknown, fieldName = 'ID', options: { required?: boolean } = {}) {
  const ids = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
  if (options.required !== false && !ids.length) throw new BusinessException(`${fieldName}不能为空`)
  return ids
}

/**
 * 从通用删除/批量操作参数中提取 ID 列表。
 * 兼容 id、ids、jobIds、logIds 等历史字段。
 */
export function idsFrom(input: IdsPayload = {}, fieldName = 'ID') {
  return parseIds(input.ids ?? input.jobIds ?? input.logIds ?? input.id, fieldName)
}
