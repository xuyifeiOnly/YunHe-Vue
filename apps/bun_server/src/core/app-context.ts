import type { AppServices, AuthUser } from './context'

/**
 * Elysia 生命周期 hook 中使用的上下文最小定义。
 * 统一入口 onBeforeHandle / onAfterHandle / onError 以及核心 hook 的参数类型。
 */
export interface AppRequestContext {
  request: Request
  path?: string
  set: {
    headers: Record<string, string>
    status?: number
  }
  server?: { requestIP?: (request: Request) => { address?: string } | null }
  services: AppServices
  requestId: string
  user?: AuthUser
  startTime?: number
  body?: unknown
  query?: Record<string, unknown>
  params?: Record<string, string | undefined>
  responseValue?: unknown
}

export function getContextPath(context: Pick<AppRequestContext, 'path' | 'request'>) {
  return context.path ?? new URL(context.request.url).pathname
}
