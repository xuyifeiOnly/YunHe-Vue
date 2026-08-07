import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { loadConfig, type AppConfig } from '../config/config'
import { AiConversationEntity, AiMessageEntity, DictDataEntity, DictTypeEntity, JobEntity, JobLogEntity, LogininforEntity, MenuEntity, OperLogEntity, PromptEntity, RoleEntity, UserEntity } from '../common'
import { logError, logInfo } from '../utils'
export const entities = [UserEntity, RoleEntity, MenuEntity, DictTypeEntity, DictDataEntity, JobEntity, JobLogEntity, LogininforEntity, OperLogEntity, PromptEntity, AiConversationEntity, AiMessageEntity]
export type DatabaseEntity = (typeof entities)[number]
export function createDataSource(config: AppConfig) {
  return new DataSource({
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    charset: config.database.charset,
    synchronize: config.database.synchronize,
    logging: false,
    entities: entities,
  })
}
declare global {
  var articleDataSource: DataSource | undefined
}
export async function getDataSource() {
  const config = loadConfig()
  const dataSource = globalThis.articleDataSource ?? createDataSource(config)

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize()
      logInfo(`数据库连接成功：${config.database.host}:${config.database.port}/${config.database.database}`)
    }

    if (!dataSource.hasMetadata(UserEntity)) {
      await dataSource.destroy()
      globalThis.articleDataSource = createDataSource(config)
      await globalThis.articleDataSource.initialize()
      logInfo(`数据库重新连接成功：${config.database.host}:${config.database.port}/${config.database.database}`)
      return globalThis.articleDataSource
    }
  } catch (error) {
    logError(`数据库连接失败：${config.database.host}:${config.database.port}/${config.database.database}`)
    throw error
  }

  globalThis.articleDataSource = dataSource
  return dataSource
}
