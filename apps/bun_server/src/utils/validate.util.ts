import { BusinessException } from '../common'

/** 校验规则定义 */
export interface ValidationRule {
  field: string
  label?: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: unknown, all: Record<string, unknown>) => string | void
}

/**
 * 按规则校验对象，失败时抛出 BusinessException
 * @param data 待校验对象
 * @param rules 校验规则数组
 * @example
 * validate(data, [
 *   { field: 'username', label: '用户名', required: true, min: 2, max: 20 },
 *   { field: 'email', label: '邮箱', pattern: /^[\w.+-]+@[\w-]+\.[\w.-]+$/ },
 * ])
 */
export function validate(data: object, rules: ValidationRule[]): void {
  const source = data as Record<string, unknown>
  for (const rule of rules) {
    const value = source[rule.field]
    const label = rule.label ?? rule.field
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new BusinessException(`${label}不能为空`)
    }
    if (value === undefined || value === null || value === '') continue
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== rule.type) throw new BusinessException(`${label}类型必须为${rule.type}`)
    }
    if (rule.min !== undefined) {
      if (typeof value === 'string' && value.length < rule.min) throw new BusinessException(`${label}长度不能少于${rule.min}个字符`)
      if (typeof value === 'number' && value < rule.min) throw new BusinessException(`${label}不能小于${rule.min}`)
    }
    if (rule.max !== undefined) {
      if (typeof value === 'string' && value.length > rule.max) throw new BusinessException(`${label}长度不能超过${rule.max}个字符`)
      if (typeof value === 'number' && value > rule.max) throw new BusinessException(`${label}不能大于${rule.max}`)
    }
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      throw new BusinessException(`${label}格式不正确`)
    }
    if (rule.validator) {
      const msg = rule.validator(value, source)
      if (msg) throw new BusinessException(msg)
    }
  }
}

/** 校验必填字段 */
export function validateRequired(data: object, fields: string[], labels?: Record<string, string>): void {
  const source = data as Record<string, unknown>
  for (const field of fields) {
    const value = source[field]
    if (value === undefined || value === null || value === '') {
      throw new BusinessException(`${labels?.[field] ?? field}不能为空`)
    }
  }
}

/** 校验手机号格式 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/** 校验邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(email)
}
