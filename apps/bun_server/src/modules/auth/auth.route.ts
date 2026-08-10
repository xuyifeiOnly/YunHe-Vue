import { CommonConstant } from '../../common'
import { getClientIp } from '../../core/auth-hook'
import type { RouteContext } from '../../core/route-context'
import { assertRecord, parseString } from '../../core/validation'
import type { AppLike, RouteDefinition } from '../../routes/meta'
import { registerRouteDefinitions } from '../../routes/meta'

interface LoginBody {
  username: string
  password: string
  uuid: string
  captcha: string
}

const routes = [
  {
    method: 'GET',
    path: '/test',
    public: true,
    description: '测试接口',
    handler: () => 'test',
  },
  {
    method: 'GET',
    path: '/captcha',
    public: true,
    description: '验证码',
    handler: ({ services }: RouteContext) => services.authService.getCaptcha(),
  },
  {
    method: 'POST',
    path: '/login',
    public: true,
    description: '登录',
    handler: ({
      body,
      request,
      requestId,
      server,
      services,
    }: RouteContext<LoginBody>) =>
      services.authService.login(body, {
        ip: getClientIp(request, server, services.config.server.trustProxy),
        userAgent: request.headers.get('user-agent') ?? '',
        requestId,
      }),
  },
  {
    method: 'POST',
    path: '/logout',
    public: true,
    description: '退出登录',
    handler: ({ request, services }: RouteContext) => {
      const authorization = request.headers.get(CommonConstant.AUTHORIZATION)
      const token = authorization?.startsWith(`${CommonConstant.TOKEN_PREFIX} `)
        ? authorization.slice(`${CommonConstant.TOKEN_PREFIX} `.length)
        : undefined
      return services.authService.logout(token)
    },
  },
  {
    method: 'GET',
    path: '/getInfo',
    description: '登录用户信息',
    handler: ({ user, services }: RouteContext) =>
      services.authService.getInfo(user!.userId),
  },
  {
    method: 'GET',
    path: '/getRoutes',
    description: '登录用户路由',
    handler: ({ user, services }: RouteContext) =>
      services.authService.getRoutes(user!.userId),
  },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
