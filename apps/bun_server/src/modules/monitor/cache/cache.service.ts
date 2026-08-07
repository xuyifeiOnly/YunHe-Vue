import { BusinessException, RedisConstant } from '../../../common'
import type { RedisService } from '../../../shared/redis.service'
import { parseCommandStats, parseRedisInfo } from '../utils'

export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  public async cacheInfo() {
    const [rawInfo, rawCommandstats, dbsize] = await Promise.all([
      this.redisService.client.info().catch(() => ''),
      this.redisService.client.info('commandstats').catch(() => ''),
      this.redisService.client.dbsize().catch(() => 0),
    ])
    return {
      dbsize,
      dbSize: dbsize,
      info: parseRedisInfo(rawInfo),
      commandstats: parseCommandStats(rawCommandstats),
    }
  }

  public cacheNames() {
    return [
      this.buildCacheName(RedisConstant.CAPTCHA_KEY, '验证码'),
      this.buildCacheName(RedisConstant.ACCESS_TOKEN_KEY, '用户信息'),
      this.buildCacheName(RedisConstant.DICTTYPE_KEY, '数据字典'),
      this.buildCacheName(RedisConstant.THROTTLE_LIMIT, '限流处理'),
      this.buildCacheName(RedisConstant.RESPONSE_CACHE, '响应缓存'),
      this.buildCacheName(RedisConstant.REPEAT_SUBMIT_KEY, '防重提交'),
    ]
  }

  public async cacheKeys(pattern = '*') {
    const normalized = this.normalizeCacheName(pattern)
    if (!normalized) return []
    const finalPattern =
      normalized.endsWith(':*') || normalized.includes('*')
        ? normalized
        : `${normalized}:*`
    return this.redisService.scanKeys(finalPattern)
  }

  public async cacheDetail(key: string) {
    if (!key) throw new BusinessException('缓存键名不能为空')
    const finalKey = this.normalizeCacheKey(key)
    const value = await this.redisService.get(finalKey)
    return value ?? ''
  }

  public async deleteCacheName(name: string) {
    if (!name) throw new BusinessException('缓存分类名称不能为空')
    const keys = await this.cacheKeys(name)
    if (keys.length) await this.redisService.del(...keys)
    return `成功清理了 ${keys.length} 条数据`
  }

  public async deleteCacheKey(key: string) {
    if (!key) throw new BusinessException('缓存键名不能为空')
    await this.redisService.del(this.normalizeCacheKey(key))
    return '删除成功'
  }

  public async deleteCacheKeys(pattern: string) {
    const finalPattern = this.normalizeCacheName(pattern.trim())
    if (!finalPattern) throw new BusinessException('缓存键名不能为空')
    if (finalPattern === '*') throw new BusinessException('不允许删除全部缓存')
    this.assertAllowedCachePattern(finalPattern)
    const keys = await this.redisService.scanKeys(finalPattern)
    if (keys.length) await this.redisService.del(...keys)
    return '删除成功'
  }

  private buildCacheName(prefix: string, remark: string) {
    return { prefix, key: '', value: '', remark }
  }

  private assertAllowedCachePattern(pattern: string) {
    const allowed = this.cacheNames().some(
      (item) =>
        pattern === item.prefix || pattern.startsWith(`${item.prefix}:`),
    )
    if (!allowed) throw new BusinessException('缓存键名不在允许清理范围内')
  }

  private normalizeCacheName(name: string) {
    if (!name || name === 'undefined' || name === 'null') return ''
    return name.replace(/^undefined:/, '').replace(/^null:/, '')
  }

  private normalizeCacheKey(key: string) {
    return key.replace(/^undefined:/, '').replace(/^null:/, '')
  }
}
