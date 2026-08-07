import { describe, expect, test } from 'bun:test'
import { BusinessException } from '../common'
import {
  assertRecord,
  parseBoolean,
  parseIds,
  parsePagination,
  parsePositiveInt,
  parseString,
} from './validation'

describe('validation', () => {
  test('parsePositiveInt 解析正整数', () => {
    expect(parsePositiveInt('3', '数量')).toBe(3)
    expect(parsePositiveInt(undefined, '数量', 10)).toBe(10)
    expect(() => parsePositiveInt('0', '数量')).toThrow(BusinessException)
  })

  test('parseString 处理必填和长度', () => {
    expect(parseString('  abc  ', '名称')).toBe('abc')
    expect(() => parseString('', '名称', { required: true })).toThrow(
      BusinessException,
    )
    expect(() => parseString('abcd', '名称', { max: 3 })).toThrow(
      BusinessException,
    )
  })

  test('parseBoolean 解析布尔值', () => {
    expect(parseBoolean(true, '启用')).toBe(true)
    expect(parseBoolean('false', '启用')).toBe(false)
    expect(parseBoolean(undefined, '启用', true)).toBe(true)
    expect(() => parseBoolean('yes', '启用')).toThrow(BusinessException)
  })

  test('assertRecord 拒绝非对象', () => {
    expect(assertRecord({ id: 1 }).id).toBe(1)
    expect(() => assertRecord([])).toThrow(BusinessException)
  })

  test('parsePagination 限制分页大小', () => {
    expect(parsePagination({ pageNo: '2', pageSize: '20' })).toMatchObject({
      pageNo: 2,
      pageSize: 20,
      skip: 20,
    })
    expect(() => parsePagination({ pageSize: '1001' })).toThrow(
      BusinessException,
    )
  })

  test('parseIds 解析 ID 列表', () => {
    expect(parseIds('1, 2')).toEqual(['1', '2'])
    expect(parseIds(['1', '2'])).toEqual(['1', '2'])
    expect(() => parseIds('')).toThrow(BusinessException)
  })
})
