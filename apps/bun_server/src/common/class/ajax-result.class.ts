export class AjaxResult {
  readonly code: number
  readonly message: string;
  [key: string]: unknown

  private constructor(
    code: number,
    message: string,
    data?: Record<string, unknown> | null,
  ) {
    this.code = code
    this.message = message
    if (data && Object.keys(data).length > 0) Object.assign(this, data)
  }

  static success(data?: Record<string, unknown>, message = '请求成功') {
    return new AjaxResult(200, message, data)
  }

  static error(
    message = '请求失败',
    code = 500,
    data?: Record<string, unknown>,
  ) {
    return new AjaxResult(code, message, data)
  }
}
