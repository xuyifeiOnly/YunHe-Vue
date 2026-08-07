import { In, Like, type Repository } from 'typeorm'
import { BusinessException, PromptEntity } from '../../../common'

export class PromptService {
  constructor(private readonly promptRepository: Repository<PromptEntity>) {}

  public async findList(query: Record<string, string | undefined>) {
    const pageNo = Number(query.pageNo ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    const where: Record<string, unknown> = {}
    if (query.title) where.title = Like(`%${query.title}%`)
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    const [list, total] = await this.promptRepository.findAndCount({ where, skip: (pageNo - 1) * pageSize, take: pageSize, order: { createTime: 'DESC' } })
    return { list, total }
  }

  public async findOneById(id: string) {
    const prompt = await this.promptRepository.findOneBy({ id })
    if (!prompt) throw new BusinessException('提示词不存在')
    return prompt
  }

  public async create(data: Partial<PromptEntity>) {
    await this.promptRepository.save(this.promptRepository.create(data))
    return '创建成功'
  }

  public async update(data: Partial<PromptEntity>) {
    if (!data.id) throw new BusinessException('提示词ID不能为空')
    await this.promptRepository.update(data.id, data)
    return '更新成功'
  }

  public async delete(ids: string) {
    const idList = ids.split(',').filter(Boolean)
    await this.promptRepository.delete({ id: In(idList) })
    return '删除成功'
  }
}
