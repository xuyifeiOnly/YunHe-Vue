import { Redis, type RedisOptions } from 'ioredis'
import type { AppConfig } from '../config/config'
import { logError, logInfo } from '../utils'

export class RedisService {
  private readonly redisClient: Redis
  private ready = false

  constructor(config: AppConfig) {
    const redisConfig: RedisOptions = {
      ...config.redis,
      // 每 30 秒发送 TCP keepalive 探测，防止远程 Redis 或中间网络设备清理空闲连接
      keepAlive: 30,
      connectTimeout: 10000,
    }
    this.redisClient = new Redis(redisConfig)
    // ready 事件代表认证完成、可执行命令，才是真正的"连接成功"
    this.redisClient.on('ready', () => {
      if (!this.ready) {
        this.ready = true
        logInfo('Redis 连接成功')
      }
    })
    this.redisClient.on('end', () => {
      if (this.ready) {
        this.ready = false
        logError('Redis 连接断开')
      }
    })
    this.redisClient.on('error', (error) => {
      logError(this.ready ? 'Redis 运行异常' : 'Redis 连接失败', error)
    })
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
