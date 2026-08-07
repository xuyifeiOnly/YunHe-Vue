import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'

export interface AppConfig {
  server: { port: number; globalPrefix: string; isDemo: boolean }
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
  appConfig = config
  return appConfig
}
