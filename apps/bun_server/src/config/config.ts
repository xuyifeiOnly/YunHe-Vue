import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'

export interface AppConfig {
  server: {
    port: number
    globalPrefix: string
    isDemo: boolean
    corsOrigins: string[]
  }
  database: {
    host: string
    port: number
    username: string
    password: string
    database: string
    charset: string
    synchronize: boolean
  }
  redis: { host: string; port: number; password?: string; db: number }
  jwt: { secret: string; expiresIn: number }
  email: {
    from: string
    host: string
    port: number
    secure: boolean
    code: string
  }
  openai: {
    apiKey: string
    model: string
    baseURL: string
    temperature: number
    maxTokens: number
  }
}
export let appConfig: AppConfig
export function loadConfig(): AppConfig {
  if (appConfig) return appConfig
  const configPath = join(process.cwd(), 'config/config.yaml')
  const localPath = join(process.cwd(), 'config/config.local.yaml')
  const filePath = existsSync(localPath) ? localPath : configPath
  const config = loadYaml(readFileSync(filePath, 'utf8')) as AppConfig
  appConfig = applyEnvConfig(config)
  return appConfig
}

function applyEnvConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    server: {
      ...config.server,
      port: numberEnv('SERVER_PORT', config.server.port),
      globalPrefix: stringEnv('SERVER_GLOBAL_PREFIX', config.server.globalPrefix),
      isDemo: booleanEnv('SERVER_IS_DEMO', config.server.isDemo),
      corsOrigins: listEnv('SERVER_CORS_ORIGINS', config.server.corsOrigins ?? []),
    },
    database: {
      ...config.database,
      host: stringEnv('DB_HOST', config.database.host),
      port: numberEnv('DB_PORT', config.database.port),
      username: stringEnv('DB_USERNAME', config.database.username),
      password: stringEnv('DB_PASSWORD', config.database.password),
      database: stringEnv('DB_DATABASE', config.database.database),
      synchronize: booleanEnv('DB_SYNCHRONIZE', config.database.synchronize),
    },
    redis: {
      ...config.redis,
      host: stringEnv('REDIS_HOST', config.redis.host),
      port: numberEnv('REDIS_PORT', config.redis.port),
      password: stringEnv('REDIS_PASSWORD', config.redis.password),
      db: numberEnv('REDIS_DB', config.redis.db),
    },
    jwt: {
      ...config.jwt,
      secret: stringEnv('JWT_SECRET', config.jwt.secret),
      expiresIn: numberEnv('JWT_EXPIRES_IN', config.jwt.expiresIn),
    },
    email: {
      ...config.email,
      from: stringEnv('EMAIL_FROM', config.email.from),
      host: stringEnv('EMAIL_HOST', config.email.host),
      port: numberEnv('EMAIL_PORT', config.email.port),
      secure: booleanEnv('EMAIL_SECURE', config.email.secure),
      code: stringEnv('EMAIL_CODE', config.email.code),
    },
    openai: {
      ...config.openai,
      apiKey: stringEnv('OPENAI_API_KEY', config.openai.apiKey),
      model: stringEnv('OPENAI_MODEL', config.openai.model),
      baseURL: stringEnv('OPENAI_BASE_URL', config.openai.baseURL),
      temperature: numberEnv('OPENAI_TEMPERATURE', config.openai.temperature),
      maxTokens: numberEnv('OPENAI_MAX_TOKENS', config.openai.maxTokens),
    },
  }
}

function stringEnv(key: string, defaultValue = '') {
  return Bun.env[key] ?? defaultValue
}

function numberEnv(key: string, defaultValue: number) {
  const value = Bun.env[key]
  if (value === undefined || value === '') return defaultValue
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : defaultValue
}

function booleanEnv(key: string, defaultValue: boolean) {
  const value = Bun.env[key]
  if (value === undefined || value === '') return defaultValue
  return value === 'true'
}

function listEnv(key: string, defaultValue: string[]) {
  const value = Bun.env[key]
  if (!value) return defaultValue
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
