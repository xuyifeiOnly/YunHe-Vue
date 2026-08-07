export class BusinessException extends Error {
  public readonly code: number
  public readonly status: number

  constructor(message: string, code = 500, status = 200) {
    super(message)
    this.name = 'BusinessException'
    this.code = code
    this.status = status
  }
}
