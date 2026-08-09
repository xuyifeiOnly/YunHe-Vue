export const CommonConstant = {
  /** 默认父级 ID */
  DEFAULT_PARENT_ID: '0',
  /** 超级管理员用户 ID */
  ADMIN_USER_ID: '866b0232-507b-42a4-bdc1-47fc4a83616a',
  /** 超级管理员角色 ID */
  ADMIN_ROLE_ID: '060999e4-ae01-47a8-a0a1-d32b96490e92',
  /** 超级管理员角色编码 */
  ADMIN_ROLE_CODE: 'admin',
  /** Authorization 请求头名称 */
  AUTHORIZATION: 'authorization',
  /** Token 前缀 */
  TOKEN_PREFIX: 'Bearer',
  /** JWT 用户载荷字段名 */
  JWT_PAYLOAD: 'user',
  /** 默认登录过期时长，单位：秒 */
  LOGIN_EXPIRES_IN: 60 * 60 * 24,
  /** 请求上下文中的请求 ID 字段名 */
  REQUEST_ID_KEY: 'requestId',
  /** 请求 ID 响应头名称 */
  REQUEST_ID_HEADER: 'X-Request-Id',
  /** 正常状态值 */
  STATUS_NORMAL: '1',
  /** 禁用状态值 */
  STATUS_DISABLE: '0',
  /** 接口限流统计窗口，单位：秒 */
  THROTTLE_WINDOW_SECONDS: 10,
  /** 接口限流窗口内最大请求次数 */
  THROTTLE_LIMIT: 10,
  /** 接口限流锁定时长，单位：秒 */
  THROTTLE_LOCK_SECONDS: 30 * 60,
  /** 默认响应缓存时长，单位：秒 */
  RESPONSE_CACHE_TTL: 60,
  /** 默认重复提交拦截间隔，单位：秒 */
  REPEAT_SUBMIT_INTERVAL: 5,
  /** 图形验证码有效时长，单位：秒 */
  CAPTCHA_EXPIRES_IN: 60,
  /** 邮件验证码有效时长，单位：分钟 */
  EMAIL_CAPTCHA_EXPIRES_IN: 5,
  /** 单个上传文件大小限制，单位：字节 */
  UPLOAD_FILE_SIZE_LIMIT: 10 * 1024 * 1024,
} as const
