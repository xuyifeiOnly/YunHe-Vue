import { randomUUID } from 'node:crypto'
import svgCaptcha from 'svg-captcha'
import { BusinessException, RedisConstant } from '../common'
import type { RedisService } from './redis.service'

export class CaptchaService {
  private readonly CAPTCHA_EXPIRES_IN = 60

  constructor(private readonly redisService: RedisService) {}

  public async create(): Promise<{ uuid: string; captcha: string }> {
    const uuid = randomUUID()
    const { data, text } = svgCaptcha.createMathExpr({ background: '#C0C8BE', noise: 4 })
    const captcha = `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`
    await this.redisService.set(`${RedisConstant.CAPTCHA_KEY}:${uuid}`, text, 'EX', this.CAPTCHA_EXPIRES_IN)
    return { uuid, captcha }
  }

  public async validate(uuid: string, captcha: string): Promise<boolean> {
    if (!uuid || !captcha) throw new BusinessException('验证码校验参数不完整')
    const key = `${RedisConstant.CAPTCHA_KEY}:${uuid}`
    const cachedValue = await this.redisService.get(key)
    if (!cachedValue) throw new BusinessException('验证码已过期，请刷新后重试')
    if (cachedValue.toLowerCase() !== captcha.toLowerCase()) throw new BusinessException('验证码错误，请刷新后重试')
    await this.redisService.del(key)
    return true
  }
}
