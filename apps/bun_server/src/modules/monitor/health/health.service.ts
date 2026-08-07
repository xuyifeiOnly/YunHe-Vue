import si from 'systeminformation'
import type { Repository } from 'typeorm'
import type { JobEntity } from '../../../common'
import type { RedisService } from '../../../shared/redis.service'

export class HealthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jobRepository: Repository<JobEntity>,
  ) {}

  public health() {
    return { status: 'ok', uptime: process.uptime(), timestamp: Date.now() }
  }

  public async readiness() {
    const database = this.jobRepository.manager.connection.isInitialized
    const redis = await this.redisService.client.ping().then(() => true).catch(() => false)
    return { status: database && redis ? 'ok' : 'error', checks: { database, redis } }
  }

  public async databaseHealth() {
    await this.jobRepository.query('SELECT 1')
    return { status: 'up' }
  }

  public memoryHealth() {
    const memory = process.memoryUsage()
    const status = memory.heapUsed < 200 * 1024 * 1024 ? 'up' : 'down'
    return { status, memory, details: { memory_heap: { status, used: memory.heapUsed, threshold: 200 * 1024 * 1024 } } }
  }

  public rssHealth() {
    const memory = process.memoryUsage()
    const status = memory.rss < 200 * 1024 * 1024 ? 'up' : 'down'
    return { status, memory, details: { memory_rss: { status, used: memory.rss, threshold: 200 * 1024 * 1024 } } }
  }

  public async storageHealth() {
    const storage = await si.fsSize()
    const disk = storage.find((item) => item.mount === '/') ?? storage[0]
    const status = !disk || disk.use < 75 ? 'up' : 'down'
    return { status, storage, details: { disk: { status, usedPercent: disk?.use, thresholdPercent: 75 } } }
  }

  public async networkHealth() {
    try {
      await fetch('https://gitee.com/decade9527', { method: 'HEAD', signal: AbortSignal.timeout(3000) })
      return { status: 'ok', info: { network: { status: 'up' } }, error: {}, details: { network: { status: 'up' } } }
    } catch {
      return { status: 'error', info: {}, error: { network: { status: 'down', message: '网络不通' } }, details: { network: { status: 'down' } } }
    }
  }
}
