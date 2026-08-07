import { BusinessException } from '../../../common'
import type { RouteContext } from '../../../core/route-context'
import { assertRecord, parsePositiveInt, parseString } from '../../../core/validation'
import type { AppLike, RouteDefinition } from '../../../routes/meta'
import { registerRouteDefinitions } from '../../../routes/meta'

interface UploadFileBody { file?: File }
interface CheckFileBody { hash?: string; fileName?: string }
interface ChunkBody { file?: File; hash?: string; index?: string | number }
interface ParsedChunkBody { file: File; hash: string; index: number }
interface MergeBody { hash: string; fileName: string; totalChunks?: number | string }
interface ClearChunkQuery { hash?: string }

function parseFile(value: unknown) {
  if (!(value instanceof File)) throw new BusinessException('上传文件不能为空')
  return value
}

function parseHash(value: unknown) {
  const hash = parseString(value, '文件 hash', { required: true, max: 128 })
  if (!/^[a-fA-F0-9]{32,128}$/.test(hash)) throw new BusinessException('文件 hash 格式错误')
  return hash
}

function parseCheckBody(body: unknown): CheckFileBody {
  const data = assertRecord(body)
  return {
    hash: parseHash(data.hash),
    fileName: parseString(data.fileName, '文件名', { required: true, max: 255 }),
  }
}

function parseChunkIndex(value: unknown) {
  const index = parsePositiveInt(value, '分片序号')
  if (index > 100000) throw new BusinessException('分片序号超出限制')
  return index - 1
}

function parseTotalChunks(value: unknown) {
  const totalChunks = parsePositiveInt(value, '分片总数')
  if (totalChunks > 100000) throw new BusinessException('分片总数超出限制')
  return totalChunks
}

function parseChunkBody(body: unknown): ParsedChunkBody {
  const data = assertRecord(body)
  return {
    file: parseFile(data.file),
    hash: parseHash(data.hash),
    index: parseChunkIndex(data.index),
  }
}

function parseMergeBody(body: unknown): MergeBody {
  const data = assertRecord(body)
  return {
    hash: parseHash(data.hash ?? data.fileHash),
    fileName: parseString(data.fileName, '文件名', { required: true, max: 255 }),
    totalChunks: data.totalChunks === undefined ? undefined : parseTotalChunks(data.totalChunks),
  }
}

const routes = [
  { method: 'POST', path: '/common/upload/file', description: '文件上传', repeatSubmit: false, handler: ({ body, services }: RouteContext<UploadFileBody>) => services.uploadService.uploadFile(parseFile(body.file)) },
  { method: 'POST', path: '/common/upload/check', description: '上传检查', repeatSubmit: false, handler: ({ body, services }: RouteContext<CheckFileBody>) => services.uploadService.checkFile(parseCheckBody(body)) },
  { method: 'POST', path: '/common/upload/chunk', description: '分片上传', repeatSubmit: false, handler: ({ body, services }: RouteContext<ChunkBody>) => {
    const data = parseChunkBody(body)
    return services.uploadService.uploadChunk(data.file, data.hash, data.index)
  } },
  { method: 'POST', path: '/common/upload/chunk/merge', description: '分片合并', repeatSubmit: false, handler: ({ body, services }: RouteContext<MergeBody>) => services.uploadService.mergeChunks(parseMergeBody(body)) },
  { method: 'DELETE', path: '/common/upload/chunk/clear', description: '分片清理', repeatSubmit: false, handler: ({ query, services }: RouteContext<unknown, ClearChunkQuery>) => services.uploadService.clearChunk(parseHash(query.hash)) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
