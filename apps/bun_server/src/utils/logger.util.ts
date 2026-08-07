import { resolve } from 'node:path'
import { format, transports, createLogger, type Logger } from 'winston'
import 'winston-daily-rotate-file'
import { formatTime } from './time.util'

const isDev = process.env.NODE_ENV === 'development'
const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })

/** 格式化生产环境的日志格式 */
function formatLog(info: Record<string, unknown>) {
  const record: Record<string, unknown> = {}
  record.level = info.level
  record.time = formatTime()
  record.context = info.context
  record.url = info.url
  record.message = info.message
  record.query = info.query
  record.body = info.body
  record.stack = info.stack
  return JSON.stringify(record)
}

/** 创建按日期轮换的文件日志传输器 */
function createFileTransport(level: string, dirname: string) {
  return new transports.DailyRotateFile({
    level,
    dirname: resolve(dirname),
    datePattern: 'YYYYMMDD',
    filename: `${level}-%DATE%.log`,
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '14d',
    format: format.combine(timestampFormat, format.errors({ stack: true }), format.json(), format.printf(formatLog)),
  })
}

const transportList = [
  new transports.Console({
    format: format.combine(timestampFormat, format.printf((info) => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`)),
  }),
  ...(!isDev ? [createFileTransport('info', 'logs/info'), createFileTransport('error', 'logs/error')] : []),
]

/** 全局 Logger 实例 */
export const logger: Logger = createLogger({
  transports: transportList,
  exitOnError: false,
  level: 'verbose',
})

/** 带上下文的日志方法 */
export function logInfo(message: string, context?: Record<string, unknown>) {
  logger.info(message, context)
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>) {
  const meta: Record<string, unknown> = { ...context }
  if (error instanceof Error) {
    meta.stack = error.stack
    meta.message = error.message
  }
  logger.error(message, meta)
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  logger.warn(message, context)
}
