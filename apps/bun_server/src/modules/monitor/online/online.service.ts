import { UAParser } from 'ua-parser-js'
import { BusinessException, RedisConstant } from '../../../common'
import { parsePagination } from '../../../core/validation'
import type { RedisService } from '../../../shared/redis.service'
import { getLocationByIP } from '../../../utils'
import type { QueryParams } from '../utils'

type OnlineUserRecord = Record<string, unknown>

export class OnlineService {
  constructor(private readonly redisService: RedisService) {}

  public async onlineList(query: QueryParams = {}) {
    const page = parsePagination(query)
    const tokenKeys = await this.redisService.scanKeys(`${RedisConstant.ACCESS_TOKEN_KEY}:*`)
    const records = (await Promise.all(
      tokenKeys.map(async (key) => {
        const id = key.replace(`${RedisConstant.ACCESS_TOKEN_KEY}:`, '')
        const value = await this.redisService.get(`${RedisConstant.ADMIN_USER_ONLINE_KEY}:${id}`)
        const item = value ? JSON.parse(value) : { id }
        return await this.normalizeOnlineUser(item)
      }),
    )).filter((item) => (!query.username || String(item.username ?? '').includes(query.username)) && (!query.ip || String(item.ip ?? '').includes(query.ip)) && (!query.location || String(item.location ?? '').includes(query.location)))
    const list = records.slice(page.skip, page.skip + page.take)
    return { total: records.length, records: list, list }
  }

  public async onlineCount() {
    return (await this.redisService.scanKeys(`${RedisConstant.ACCESS_TOKEN_KEY}:*`)).length
  }

  public async forceLogout(data: { userId?: string; uuid?: string }) {
    if (!data.userId || !data.uuid) throw new BusinessException('参数不完整')
    await this.redisService.del(`${RedisConstant.ACCESS_TOKEN_KEY}:${data.userId}:${data.uuid}`, `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${data.userId}:${data.uuid}`)
    return '强退成功'
  }

  private async normalizeOnlineUser(item: OnlineUserRecord) {
    const ip = String(item.ip ?? item.loginIp ?? item.ipaddr ?? '')
    const parser = new UAParser(String(item.userAgent ?? ''))
    const location = item.location ?? item.loginLocation ?? (ip ? await getLocationByIP(ip).catch(() => '') : '')
    return {
      ...item,
      tokenId: item.tokenId ?? item.uuid ?? item.id,
      uuid: item.uuid ?? item.id,
      userId: item.userId ?? item.id,
      username: item.username ?? item.userName ?? item.nickName ?? '',
      ip,
      location,
      loginTime: item.loginTime ?? item.createTime ?? '',
      browser: item.browser ?? parser.getBrowser().name ?? '',
      os: item.os ?? parser.getOS().name ?? '',
    }
  }
}
