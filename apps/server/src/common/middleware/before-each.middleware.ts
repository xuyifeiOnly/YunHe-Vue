import { randomUUID } from '@/utils'
import { CommonConstant } from '../constant/common.constant'
import { Injectable, Logger, NestMiddleware } from '@nestjs/common'

@Injectable()
export class BeforeEachMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BeforeEachMiddleware.name)

  use(request: ExpressRequest, response: ExpressResponse, next: ExpressNextFunction): void {
    // 1. 生成请求唯一ID，绑定到请求对象并返回响应头
    console.log('11111111111')
    const requestId = randomUUID()
    request[CommonConstant.REQUEST_ID_KEY] = requestId
    response.setHeader(CommonConstant.REQUEST_ID_HEADER, requestId)

    // 2. 打印请求信息
    this.printRequestInfo(request)

    // 3. 继续执行后续中间件/路由处理
    next()
  }

  private printRequestInfo(request: ExpressRequest) {
    // console.log('request: ', request)
    const method = request.method
    const query = request.query
    const body = request.body
    const requestId = request[CommonConstant.REQUEST_ID_KEY]
    const keys = ['authorization', 'user-agent']
    const headers = keys.reduce((acc, key) => ({ ...acc, [key]: request.headers[key] }), {})
    const url = request.path || ''
    this.logger.verbose(`${method} ${url} ${requestId}`)
    const logInfo: Record<string, any> = {}
    if (query && Object.keys(query).length) logInfo.query = query
    if (body && Object.keys(body).length) logInfo.body = body
    this.logger.log(JSON.stringify(Object.assign({}, logInfo, headers)))
  }
}
