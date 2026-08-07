import 'reflect-metadata'
import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './src/config/config'
import { createDataSource, getDataSource } from './src/database/data-source'
import { BusinessException, CommonConstant } from './src/common'
import { authHook, getResponseCache, setResponseCache } from './src/core/auth-hook'
import { recordOperlog } from './src/core/operlog-recorder'
import { registerModuleRoutes } from './src/core/route-loader'
import { errorResponse, successResponse } from './src/core/response'
import { applySecurityHeaders } from './src/core/security'
import { createServices } from './src/core/services'
import { logError, logInfo } from './src/utils'

const config = loadConfig()
const uploadRoot = join(process.cwd(), 'uploads')
mkdirSync(uploadRoot, { recursive: true })
const dataSource =await getDataSource()
const services = createServices(config, dataSource, uploadRoot)
const prefix = `/${config.server.globalPrefix}`

const app = new Elysia()
  .use(cors({ origin: true, credentials: true }))
  .use(staticPlugin({ assets: uploadRoot, prefix: '/uploads' }))
  .derive(({ request }) => ({
    services,
    requestId: request.headers.get(CommonConstant.REQUEST_ID_HEADER) ?? crypto.randomUUID(),
  }))
  .onBeforeHandle(async (context) => {
    applySecurityHeaders(context.set.headers as any)
    context.set.headers[CommonConstant.REQUEST_ID_HEADER] = context.requestId
    ;(context as any).startTime = Date.now()
    const cached = await getResponseCache(context as any)
    if (cached) return JSON.parse(cached)
    return authHook(context as any)
  })
  .onAfterHandle(async (context) => {
    const { responseValue, requestId } = context
    await setResponseCache(context as any, responseValue)
    void recordOperlog(context as any, responseValue, true)
    if (responseValue instanceof Response) return responseValue
    return successResponse(responseValue, requestId)
  })
  .onError((context) => {
    const { error, set, requestId } = context
    if (error instanceof BusinessException) set.status = error.status
    else set.status = 500
    void recordOperlog(context as any, error, false)
    return errorResponse(error, requestId ?? crypto.randomUUID())
  })

const api = new Elysia({ prefix })
await registerModuleRoutes(api)

app.use(api)
app.listen(config.server.port)

logInfo(`Bun + Elysia 服务已启动：http://localhost:${config.server.port}${prefix}`)
