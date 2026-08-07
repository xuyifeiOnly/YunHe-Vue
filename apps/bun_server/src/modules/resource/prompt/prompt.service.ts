import {
  Equal,
  In,
  Like,
  Not,
  type FindOptionsWhere,
  type Repository,
} from 'typeorm'
import { BusinessException, PromptEntity } from '../../../common'
import { pageResult, parseIds, parsePagination } from '../../../core/validation'
import type {
  CreatePromptBody,
  PromptListQuery,
  UpdatePromptBody,
} from './prompt.dto'

export class PromptService {
  constructor(private readonly promptRepository: Repository<PromptEntity>) {}

  public async findList(query: PromptListQuery) {
    const page = parsePagination(query)
    const where: FindOptionsWhere<PromptEntity> = {}
    if (query.title) where.title = Like(`%${query.title}%`)
    if (query.type) where.type = Like(`%${query.type}%`)
    if (query.status) where.status = Equal(query.status)
    const [records, total] = await this.promptRepository.findAndCount({
      where,
      skip: page.skip,
      take: page.take,
      order: { createTime: 'DESC' },
    })
    return pageResult(records, total)
  }

  public async findOneById(id: string) {
    const prompt = await this.promptRepository.findOneBy({ id: Equal(id) })
    if (!prompt) throw new BusinessException('提示词不存在')
    return prompt
  }

  public async create(data: CreatePromptBody) {
    const exists = await this.promptRepository.existsBy({
      title: Equal(data.title),
      type: Equal(data.type),
    })
    if (exists) throw new BusinessException('提示词标题已存在')
    await this.promptRepository.save(this.promptRepository.create(data))
    return '添加成功'
  }

  public async update(data: UpdatePromptBody) {
    if (!data.id) throw new BusinessException('提示词ID不能为空')
    const prompt = await this.promptRepository.findOneBy({ id: Equal(data.id) })
    if (!prompt) throw new BusinessException('提示词不存在')
    if (data.title && data.title !== prompt.title) {
      const exists = await this.promptRepository.existsBy({
        title: Equal(data.title),
        id: Not(data.id),
      })
      if (exists) throw new BusinessException('提示词标题已存在')
    }
    Object.assign(prompt, data)
    await this.promptRepository.save(prompt)
    return '修改成功'
  }

  public async delete(ids: string) {
    const idList = parseIds(ids, '提示词ID')
    const list = await this.promptRepository.findBy({ id: In(idList) })
    if (!list.length) throw new BusinessException('提示词不存在')
    await this.promptRepository.delete(idList)
    return '删除成功'
  }
}
