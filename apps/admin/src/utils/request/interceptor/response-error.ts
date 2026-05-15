import axios from 'axios'
import { sleep, TipModal } from '@/utils'
import { HttpStatusCode, type AxiosInstance } from 'axios'

const ErrorMessageMap: Record<string, string> = {
  [HttpStatusCode.BadRequest]: '请求参数错误，请检查后重试',
  [HttpStatusCode.Unauthorized]: '登录已过期，请重新登录',
  [HttpStatusCode.Forbidden]: '无权限访问该资源，请联系管理员授权',
  [HttpStatusCode.NotFound]: '请求的资源不存在，请检查接口地址',
  [HttpStatusCode.MethodNotAllowed]: '请求方法不允许，请检查请求类型',
  [HttpStatusCode.RequestTimeout]: '接口请求超时，请稍后重试',
  [HttpStatusCode.UnsupportedMediaType]: '不支持的请求格式，请检查参数类型',
  [HttpStatusCode.UnprocessableEntity]: '参数校验失败，请核对输入内容',
  [HttpStatusCode.InternalServerError]: '服务器内部错误，请联系管理员处理',
  [HttpStatusCode.BadGateway]: '网关错误，服务暂不可用',
  [HttpStatusCode.ServiceUnavailable]: '服务正在维护中，请稍后重试',
  [HttpStatusCode.GatewayTimeout]: '网关超时，请稍后重试',
}

// 解决 401 时并发接口导致重复弹窗问题
let isLogout = false

export function responseErrorInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(undefined, async (error: any) => {
    console.log('responseErrorInterceptor: ', error)

    // 🔥 关键：已触发登出，直接拦截所有后续请求（不提示、不执行）
    if (isLogout) return Promise.reject(error)

    // 忽略主动取消请求
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return Promise.reject(error)
    }

    let { message = '网络连接异常，请检查服务或网络是否正常' } = error
    let status = -1

    // 提取状态码
    if (message.includes('failed with status code')) status = parseInt(message.substr(message.length - 3))
    if (error?.response?.status) status = error.response.status

    // 提取错误信息（优先级：后端返回 > 本地映射）
    message = ErrorMessageMap[status.toString()] || message
    if (error?.response?.data?.message) message = error.response.data.message

    // 统一提示错误信息
    TipModal.msgError(message)

    // 处理 401 错误（会话过期）
    if (status === HttpStatusCode.Unauthorized) {
      isLogout = true // 上锁：只允许执行一次 401 处理逻辑
      await useUserStore().logout()
      await sleep(1000)
      window.location.reload()
      return Promise.reject(error)
    }

    // 传递给 next 处理异常响应
    return Promise.reject(error)
  })
}
