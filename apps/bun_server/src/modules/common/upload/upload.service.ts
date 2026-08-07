import { createHash } from 'node:crypto'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { BusinessException } from '../../../common'

export class UploadService {
  constructor(private readonly uploadRoot: string) {}

  public async uploadFile(file: File | undefined) {
    if (!file) throw new BusinessException('上传文件不能为空')
    if (file.size > 10 * 1024 * 1024)
      throw new BusinessException('文件大于10MB，请使用分片上传')
    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = await this.createSha256(buffer)
    const fileName = `${hash}${extname(file.name)}`
    const filePath = this.safeResolve(this.uploadRoot, fileName)
    if (!existsSync(filePath)) await writeFile(filePath, buffer)
    return `/uploads/${fileName}`
  }

  public async checkFile(data: {
    hash?: string
    fileHash?: string
    fileName?: string
  }) {
    const hash = data.fileHash ?? data.hash ?? ''
    if (hash) this.validateHash(hash)
    const ext = data.fileName ? extname(data.fileName) : ''
    const finalName = hash ? `${hash}${ext}` : ''
    const finalPath = finalName
      ? this.safeResolve(this.uploadRoot, finalName)
      : ''
    const chunkDir = hash
      ? this.safeResolve(this.uploadRoot, 'chunks', hash)
      : ''
    const isExist = Boolean(finalPath && existsSync(finalPath))
    return {
      isExist,
      exists: isExist,
      uploadedChunks:
        chunkDir && existsSync(chunkDir) ? readdirSync(chunkDir) : [],
      uploaded: chunkDir && existsSync(chunkDir) ? readdirSync(chunkDir) : [],
      url: isExist ? `/uploads/${finalName}` : '',
    }
  }

  public async uploadChunk(
    file: File | undefined,
    hash?: string,
    index?: string | number,
    chunkHash?: string,
  ) {
    if (!file || !hash) throw new BusinessException('分片参数不完整')
    this.validateHash(hash)
    const chunkName = this.getSafeChunkName(
      chunkHash ?? String(index ?? file.name),
    )
    const chunkDir = this.safeResolve(this.uploadRoot, 'chunks', hash)
    mkdirSync(chunkDir, { recursive: true })
    await writeFile(
      this.safeResolve(chunkDir, chunkName),
      Buffer.from(await file.arrayBuffer()),
    )
    return '分片上传成功'
  }

  public async mergeChunks(data: {
    hash?: string
    fileHash?: string
    fileName: string
    totalChunks?: number | string
  }) {
    const hash = data.fileHash ?? data.hash
    if (!hash) throw new BusinessException('文件 hash 不能为空')
    this.validateHash(hash)
    if (!data.fileName) throw new BusinessException('文件名不能为空')
    const chunkDir = this.safeResolve(this.uploadRoot, 'chunks', hash)
    const finalFileName = `${hash}${extname(data.fileName)}`
    const finalFilePath = this.safeResolve(this.uploadRoot, finalFileName)
    if (existsSync(finalFilePath)) return `/uploads/${finalFileName}`
    if (!existsSync(chunkDir))
      throw new BusinessException('分片文件不存在，请重新上传')
    const chunks = this.getOrderedChunks(chunkDir, data.totalChunks)
    const writeStream = createWriteStream(finalFilePath)
    writeStream.setMaxListeners(0)
    for (const chunk of chunks)
      await pipeline(
        createReadStream(this.safeResolve(chunkDir, chunk)),
        writeStream,
        { end: false },
      )
    writeStream.end()
    await new Promise<void>((resolve) => writeStream.on('finish', resolve))
    const finalHash = await this.createFileSha256(finalFilePath)
    if (finalHash !== hash.toLowerCase()) {
      await rm(finalFilePath, { force: true })
      throw new BusinessException('文件完整性校验失败，请重新上传')
    }
    await rm(chunkDir, { recursive: true, force: true })
    return `/uploads/${finalFileName}`
  }

  public async clearChunk(hash?: string) {
    if (hash) {
      this.validateHash(hash)
      await rm(this.safeResolve(this.uploadRoot, 'chunks', hash), {
        recursive: true,
        force: true,
      })
    }
    return '清理成功'
  }

  private validateHash(hash: string) {
    if (!/^[a-fA-F0-9]{32,128}$/.test(hash))
      throw new BusinessException('文件 hash 格式错误')
  }

  private getOrderedChunks(chunkDir: string, totalChunks?: number | string) {
    const chunks = readdirSync(chunkDir).map((item) =>
      this.getSafeChunkName(item),
    )
    if (!chunks.length) throw new BusinessException('分片文件为空，请重新上传')
    const ordered = chunks.sort(
      (a, b) =>
        Number(a.split('-').pop() ?? a) - Number(b.split('-').pop() ?? b),
    )
    if (totalChunks !== undefined && totalChunks !== '') {
      const total = Number(totalChunks)
      if (!Number.isInteger(total) || total <= 0)
        throw new BusinessException('分片总数格式错误')
      if (ordered.length !== total)
        throw new BusinessException('分片数量不完整，请重新上传')
    }
    if (ordered.every((item) => /^\d+$/.test(item))) {
      ordered.forEach((item, index) => {
        if (Number(item) !== index)
          throw new BusinessException('分片序号不连续，请重新上传')
      })
    }
    return ordered
  }

  private getSafeChunkName(name: string) {
    if (!/^\d+$/.test(name) && !/^[a-fA-F0-9_-]{1,128}$/.test(name))
      throw new BusinessException('分片序号格式错误')
    return name
  }

  private safeResolve(root: string, ...paths: string[]) {
    const rootPath = resolve(root)
    const targetPath = resolve(rootPath, ...paths)
    if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}/`))
      throw new BusinessException('文件路径非法')
    return targetPath
  }

  private async createSha256(buffer: Buffer) {
    const source = new Uint8Array(buffer)
    const digest = await crypto.subtle.digest('SHA-256', source)
    return [...new Uint8Array(digest)]
      .map((item) => item.toString(16).padStart(2, '0'))
      .join('')
  }

  private async createFileSha256(filePath: string) {
    const hash = createHash('sha256')
    await pipeline(createReadStream(filePath), hash)
    return hash.digest('hex')
  }
}
