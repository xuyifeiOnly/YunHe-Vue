import { describe, expect, test } from 'bun:test'
import { BusinessException, RedisConstant } from '../../../common'
import { CacheService } from './cache.service'

function createRedisMock() {
  return {
    client: {
      info: async () => '',
      dbsize: async () => 0,
    },
    get: async () => null,
    del: async (..._keys: string[]) => 1,
    scanKeys: async (pattern: string) => [`${pattern}:1`],
  }
}

describe('CacheService', () => {
  test('deleteCacheKeys 禁止删除全部缓存', async () => {
    const service = new CacheService(createRedisMock() as never)
    await expect(service.deleteCacheKeys('*')).rejects.toThrow(BusinessException)
  })

  test('deleteCacheKeys 禁止非系统缓存前缀', async () => {
    const service = new CacheService(createRedisMock() as never)
    await expect(service.deleteCacheKeys('custom:*')).rejects.toThrow(BusinessException)
  })

  test('deleteCacheKeys 允许系统缓存前缀', async () => {
    const service = new CacheService(createRedisMock() as never)
    await expect(service.deleteCacheKeys(`${RedisConstant.CAPTCHA_KEY}:*`)).resolves.toBe('删除成功')
  })
})
