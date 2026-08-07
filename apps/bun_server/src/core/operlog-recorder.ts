import { CommonConstant, OperLogEntity } from '../common'
import { BusinessType } from '../entities/monitor/operlog.entity'
import { getRouteMeta } from '../routes/meta'
import { formatTime, getLocationByIP, logError } from '../utils'
import { getContextPath, type AppRequestContext } from './app-context'
import { getClientIp } from './auth-hook'

export async function recordOperlog(context: AppRequestContext, result: unknown, success: boolean) {
  const path = getContextPath(context)
  const routeMeta = getRouteMeta(context.request.method, path)
  if (!routeMeta?.operLog) return
  const response = result instanceof Response ? result : undefined
  const skipTransform = routeMeta.skipTransform || response?.headers.get('content-type')?.includes('text/event-stream') || response?.headers.get('content-disposition')
  const status = success || skipTransform ? CommonConstant.STATUS_NORMAL : CommonConstant.STATUS_DISABLE
  const record = new OperLogEntity()
  record.requestId = context.requestId
  record.duration = Date.now() - Number(context.startTime ?? Date.now())
  record.title = routeMeta.operLog.title
  record.username = context.user?.username ?? ''
  record.params = await buildParams(context.request)
  record.status = status
  record.url = path
  record.businessType = (routeMeta.operLog.businessType ?? BusinessType.OTHER) as BusinessType
  record.requestMethod = context.request.method.toUpperCase()
  record.method = `${context.request.method.toUpperCase()} ${path}`
  record.ip = getClientIp(context.request, context.server)
  record.location = await getLocationByIP(record.ip)
  record.operTime = formatTime()
  await context.services.logService.createOperlog(record).catch((error: unknown) => logError('操作日志记录失败', error))
}

async function buildParams(request: Request) {
  const url = new URL(request.url)
  const params: Record<string, unknown> = { query: Object.fromEntries(url.searchParams.entries()) }
  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    const text = await request.clone().text().catch(() => '')
    if (text) {
      try {
        params.body = maskSensitiveData(JSON.parse(text))
      } catch {
        params.body = text
      }
    }
  }
  return JSON.stringify(maskSensitiveData(params), null, 2)
}

function maskSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitiveData)
  if (!value || typeof value !== 'object') return value
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    result[key] = isSensitiveKey(key) ? '******' : maskSensitiveData(item)
  }
  return result
}

function isSensitiveKey(key: string) {
  return /password|token|authorization|captcha|secret|credential/i.test(key)
}
