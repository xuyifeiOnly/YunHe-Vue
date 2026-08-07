import { AjaxResult, BusinessException } from '../common'

export function successResponse(data: unknown, requestId: string) {
  return jsonResponse(AjaxResult.success({ code: 200, success: true, message: '请求成功', requestId, data, timestamp: Date.now() }))
}

export function errorResponse(error: unknown, requestId: string) {
  const isBusiness = error instanceof BusinessException
  const code = isBusiness ? error.code : 500
  const message = error instanceof Error ? error.message : '服务器内部错误，请稍后重试'
  return jsonResponse(AjaxResult.error(message, code, { code, success: false, message, requestId, data: null, timestamp: Date.now() }))
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' } })
}
