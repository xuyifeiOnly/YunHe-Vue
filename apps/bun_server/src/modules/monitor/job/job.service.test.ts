import { describe, expect, test } from 'bun:test'
import { BusinessException } from '../../../common'
import { parseInvokeTarget } from './job.service'

describe('job.service', () => {
  test('parseInvokeTarget 解析服务、方法和参数', () => {
    expect(parseInvokeTarget('JobService.test()')).toEqual({ serviceName: 'JobService', funName: 'test', argsStr: '' })
    expect(parseInvokeTarget('UserService.sync(1,"a")')).toEqual({ serviceName: 'UserService', funName: 'sync', argsStr: '1,"a"' })
  })

  test('parseInvokeTarget 拒绝非法格式', () => {
    expect(() => parseInvokeTarget('JobService.test')).toThrow(BusinessException)
    expect(() => parseInvokeTarget('JobService.test;process.exit()')).toThrow(BusinessException)
  })
})
