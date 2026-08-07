import 'reflect-metadata'
import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from './src/config/config'
import { getDataSource } from './src/database/data-source'
import { BusinessException, CommonConstant } from './src/common'
import {
  authHook,
  getResponseCache,
  setResponseCache,
} from './src/core/auth-hook'
import { recordOperlog } from './src/core/operlog-recorder'
import { registerModuleRoutes } from './src/core/route-loader'
import { errorResponse, successResponse } from './src/core/response'
import { applySecurityHeaders } from './src/core/security'
import { createServices } from './src/core/create-services'
import type { AppRequestContext } from './src/core/app-context'
import { logInfo } from './src/utils'

const config = loadConfig()
const uploadRoot = join(process.cwd(), 'uploads')
mkdirSync(uploadRoot, { recursive: true })
const dataSource = await getDataSource()
const services = createServices(config, dataSource, uploadRoot)
const prefix = `/${config.server.globalPrefix}`

const app = new Elysia()
  .use(
    cors({
      origin: ({ headers }) => {
        const origin = headers.get('origin')
        if (!origin) return true
        return config.server.corsOrigins.includes(origin)
      },
      credentials: true,
    }),
  )
  .use(staticPlugin({ assets: uploadRoot, prefix: '/uploads' }))
  .derive(
    ({
      request,
    }): Pick<AppRequestContext, 'services' | 'requestId' | 'path'> => ({
      services,
      requestId:
        request.headers.get(CommonConstant.REQUEST_ID_HEADER) ??
        crypto.randomUUID(),
      path: new URL(request.url).pathname,
    }),
  )
  .onBeforeHandle(async (context) => {
    const ctx = context as unknown as AppRequestContext
    if (ctx.path?.startsWith('/uploads/')) return
    applySecurityHeaders(ctx.set.headers)
    ctx.set.headers[CommonConstant.REQUEST_ID_HEADER] = ctx.requestId
    ctx.startTime = Date.now()
    const cached = await getResponseCache(ctx)
    if (cached) return JSON.parse(cached)
    return authHook(ctx)
  })
  .onAfterHandle(async (context) => {
    const ctx = context as unknown as AppRequestContext & {
      responseValue: unknown
    }
    const { responseValue, requestId } = ctx
    await setResponseCache(ctx, responseValue)
    void recordOperlog(ctx, responseValue, true)
    if (responseValue instanceof Response) return responseValue
    return successResponse(responseValue, requestId)
  })
  .onError((context) => {
    const ctx = context as unknown as AppRequestContext & { error: unknown }
    const { error, set, requestId } = ctx
    if (error instanceof BusinessException) set.status = error.status
    else set.status = 500
    void recordOperlog(ctx, error, false)
    return errorResponse(error, requestId ?? crypto.randomUUID())
  })

const api = new Elysia({ prefix })
await registerModuleRoutes(api)

app.use(api)
app.listen(config.server.port)

async function shutdown() {
  await services.jobService.shutdown()
  await services.redisService.quit()
  if (dataSource.isInitialized) await dataSource.destroy()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

logInfo(
  `Bun + Elysia 服务已启动：http://localhost:${config.server.port}${prefix}`,
)
