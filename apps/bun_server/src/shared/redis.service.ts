import { Redis, type RedisOptions } from 'ioredis'
import type { AppConfig } from '../config/config'
import { logError, logInfo } from '../utils'

export class RedisService {
  private readonly redisClient: Redis

  constructor(config: AppConfig) {
    const redisConfig: RedisOptions = config.redis
    this.redisClient = new Redis(redisConfig)
    this.redisClient.on('connect', () => logInfo('Redis 连接成功'))
    this.redisClient.on('ready', () => logInfo('Redis 已准备就绪'))
    this.redisClient.on('error', (error) => logError('Redis 连接失败', error))
  }

  public get client() {
    return this.redisClient
  }

  public get set(): typeof this.redisClient.set {
    return this.redisClient.set.bind(this.redisClient)
  }

  public get get(): typeof this.redisClient.get {
    return this.redisClient.get.bind(this.redisClient)
  }

  public get del(): typeof this.redisClient.del {
    return this.redisClient.del.bind(this.redisClient)
  }

  public get keys(): typeof this.redisClient.keys {
    return this.redisClient.keys.bind(this.redisClient)
  }

  public async scanKeys(pattern: string, count = 100) {
    const keys: string[] = []
    let cursor = '0'
    do {
      const [nextCursor, batch] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      )
      cursor = nextCursor
      keys.push(...batch)
    } while (cursor !== '0')
    return keys
  }

  public get incr(): typeof this.redisClient.incr {
    return this.redisClient.incr.bind(this.redisClient)
  }

  public get expire(): typeof this.redisClient.expire {
    return this.redisClient.expire.bind(this.redisClient)
  }

  public async quit() {
    await this.redisClient.quit()
  }
}
