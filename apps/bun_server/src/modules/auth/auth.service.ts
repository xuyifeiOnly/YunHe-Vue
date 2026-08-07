import { randomUUID } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import { UAParser } from 'ua-parser-js'
import type { AppConfig } from '../../config/config'
import {
  BusinessException,
  CommonConstant,
  LogininforEntity,
  RedisConstant,
  type UserEntity,
} from '../../common'
import type { JwtPayload } from '../../core/context'
import { verifyPassword, getLocationByIP, logError } from '../../utils'
import { formatTime } from '../../utils/time.util'
import type { CaptchaService } from '../../shared/captcha.service'
import type { RedisService } from '../../shared/redis.service'
import type { LogService } from '../monitor/log/log.service'
import type { MenuService } from '../system/menu/menu.service'
import type { UserService } from '../system/user/user.service'

interface LoginRequestInfo {
  ip?: string
  userAgent?: string
  requestId?: string
}

export class AuthService {
  private readonly secret: Uint8Array
  private logService?: Pick<LogService, 'createLogininfor'>

  constructor(
    private readonly config: AppConfig,
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly redisService: RedisService,
    private readonly captchaService: CaptchaService,
  ) {
    this.secret = new TextEncoder().encode(String(config.jwt.secret))
  }

  public setLogService(logService: Pick<LogService, 'createLogininfor'>) {
    this.logService = logService
  }

  public getCaptcha() {
    return this.captchaService.create()
  }

  public async login(
    loginDto: {
      username: string
      password: string
      uuid: string
      captcha: string
    },
    requestInfo: LoginRequestInfo = {},
  ) {
    const { username, password, uuid, captcha } = loginDto
    let user: UserEntity | null = null
    try {
      await this.captchaService.validate(uuid, captcha)
      user = await this.userService.findByUsername(username)
      if (!user) throw new BusinessException('该账号不存在或已停用')
      if (!(await verifyPassword(password, user.password)))
        throw new BusinessException('账号或密码错误')
      const { accessToken, uuid: tokenUuid } =
        await this.generateAccessToken(user)
      await Promise.all([
        this.userService.updateLoginTime(user.id),
        this.writeOnlineUser(user, tokenUuid, requestInfo),
        this.writeLogininfor(
          username,
          CommonConstant.STATUS_NORMAL,
          '登录成功',
          requestInfo,
        ),
      ])
      return { accessToken, expiresIn: this.config.jwt.expiresIn }
    } catch (error) {
      await this.writeLogininfor(
        username,
        CommonConstant.STATUS_DISABLE,
        error instanceof Error ? error.message : '登录失败',
        requestInfo,
      )
      throw error
    }
  }

  public async getInfo(userId: string) {
    const user = await this.userService.findOneById(userId)
    const roleCodeList: string[] = []
    const roleIds: string[] = []
    for (const role of user.roles ?? []) {
      roleIds.push(role.id)
      roleCodeList.push(role.roleCode)
    }
    const isAdmin = roleCodeList.includes(CommonConstant.ADMIN_ROLE_CODE)
    const permissions = await this.menuService.findPermissionsByRoleIds(
      roleIds,
      isAdmin,
    )
    await Promise.all([
      this.redisService.set(
        `${RedisConstant.ADMIN_USER_ROLES}:${userId}`,
        JSON.stringify(roleCodeList),
        'EX',
        this.config.jwt.expiresIn,
      ),
      this.redisService.set(
        `${RedisConstant.ADMIN_USER_PERMISSIONS}:${userId}`,
        JSON.stringify(permissions),
        'EX',
        this.config.jwt.expiresIn,
      ),
    ])
    return { user, roles: roleCodeList, permissions }
  }

  public async getRoutes(userId: string) {
    const user = await this.userService.findOneById(userId)
    const roleIds = (user.roles ?? []).map((role) => role.id)
    const isAdmin = roleIds.includes(CommonConstant.ADMIN_ROLE_ID)
    return this.menuService.findRoutesByRoleIds(roleIds, isAdmin)
  }

  public async logout(token?: string) {
    if (!token) return '退出成功'
    try {
      const { userId, uuid } = await this.verifyToken(token)
      await this.redisService.del(
        `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`,
        `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`,
      )
    } catch (error) {
      logError('退出登录失败', error)
    }
    return '退出登录成功'
  }

  public async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret)
      const userId = String(payload.userId ?? '')
      const username = String(payload.username ?? '')
      const uuid = String(payload.uuid ?? '')
      if (!userId || !username || !uuid)
        throw new BusinessException('登录状态已失效，请重新登录', 401)
      const redisToken = await this.redisService.get(
        `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`,
      )
      if (redisToken !== token)
        throw new BusinessException('登录状态已失效，请重新登录', 401)
      return { userId, username, uuid }
    } catch (error) {
      if (error instanceof BusinessException) throw error
      throw new BusinessException('登录状态已失效，请重新登录', 401)
    }
  }

  private async writeOnlineUser(
    user: UserEntity,
    uuid: string,
    requestInfo: LoginRequestInfo,
  ) {
    const parser = new UAParser(requestInfo.userAgent ?? '')
    const ip = requestInfo.ip ?? ''
    const onlineUser = {
      userId: user.id,
      username: user.username,
      uuid,
      ip,
      location: await getLocationByIP(ip),
      browser: parser.getBrowser().name ?? '',
      os: parser.getOS().name ?? '',
      loginTime: formatTime(),
    }
    await this.redisService.set(
      `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${user.id}:${uuid}`,
      JSON.stringify(onlineUser),
      'EX',
      this.config.jwt.expiresIn,
    )
  }

  private async writeLogininfor(
    username: string,
    status: string,
    message: string,
    requestInfo: LoginRequestInfo,
  ) {
    if (!this.logService) return
    const parser = new UAParser(requestInfo.userAgent ?? '')
    const logininfor = new LogininforEntity()
    logininfor.username = username
    logininfor.ip = requestInfo.ip ?? ''
    logininfor.location = await getLocationByIP(requestInfo.ip ?? '')
    logininfor.browser = parser.getBrowser().name ?? ''
    logininfor.os = parser.getOS().name ?? ''
    logininfor.status = status
    logininfor.message = message
    logininfor.loginTime = formatTime()
    logininfor.requestId = requestInfo.requestId ?? ''
    await this.logService.createLogininfor(logininfor)
  }

  private async generateAccessToken(user: UserEntity) {
    const uuid = randomUUID()
    const accessToken = await new SignJWT({
      userId: user.id,
      username: user.username,
      uuid,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.config.jwt.expiresIn}s`)
      .sign(this.secret)
    const accessTokenKey = `${RedisConstant.ACCESS_TOKEN_KEY}:${user.id}:${uuid}`
    await this.redisService.set(
      accessTokenKey,
      accessToken,
      'EX',
      this.config.jwt.expiresIn,
    )
    return { accessTokenKey, accessToken, uuid }
  }
}
