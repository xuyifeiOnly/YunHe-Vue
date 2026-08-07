import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { Equal, type Repository } from 'typeorm'
import {
  AiConversationEntity,
  AiMessageEntity,
  BusinessException,
  CommonConstant,
} from '../../common'
import type { AppConfig } from '../../config/config'
import { buildSummaryPrompt, SYSTEM_PROMPT } from './ai.prompt'
import { runEnabledAiTools } from './ai.tools'

type ChatData = {
  message?: string
  prompt?: string
  conversationId?: string
  enableInternetSearch?: boolean
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 2)
}

export class AiService {
  private readonly model: ChatOpenAI | null
  private readonly systemPrompt = SYSTEM_PROMPT
  private readonly SUMMARY_TRIGGER_COUNT = 12
  private readonly RECENT_MESSAGE_COUNT = 6

  constructor(
    private readonly config: AppConfig,
    private readonly messageRepository: Repository<AiMessageEntity>,
    private readonly conversationRepository: Repository<AiConversationEntity>,
  ) {
    this.model = this.createModel()
  }

  public async chat(data: ChatData, userId: string) {
    const ctx = await this.prepareChatContext(data, userId)
    if (!this.model) {
      const content = `AI 配置未启用，已保存消息：${ctx.userContent}`
      await this.saveMessage(
        ctx.conversationId,
        'assistant',
        content,
        estimateTokens(content),
      )
      return { content, conversationId: ctx.conversationId }
    }
    const messages = await this.buildContextMessages(ctx.conversationId)
    await this.appendToolResults(
      messages,
      ctx.userContent,
      data.enableInternetSearch,
    )
    const response = await this.model.invoke(messages)
    const content = String(response.content ?? '')
    await this.saveMessage(
      ctx.conversationId,
      'assistant',
      content,
      estimateTokens(content),
    )
    await this.lazyUpdateSummary(ctx.conversationId)
    return { content, conversationId: ctx.conversationId }
  }

  public stream(data: ChatData, userId: string) {
    const encoder = new TextEncoder()
    const write = (payload: unknown) =>
      encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
    return new Response(
      new ReadableStream({
        start: async (controller) => {
          let conversationId = data.conversationId ?? ''
          try {
            const ctx = await this.prepareChatContext(data, userId)
            conversationId = ctx.conversationId
            if (!this.model) {
              const content = `AI 配置未启用，已保存消息：${ctx.userContent}`
              await this.saveMessage(conversationId, 'assistant', content)
              controller.enqueue(write({ content, conversationId }))
              controller.enqueue(write({ status: 'DONE', conversationId }))
              controller.close()
              return
            }
            const messages = await this.buildContextMessages(conversationId)
            await this.appendToolResults(
              messages,
              ctx.userContent,
              data.enableInternetSearch,
            )
            const prompt = ChatPromptTemplate.fromMessages(messages)
            const stream = await prompt.pipe(this.model).stream({})
            let fullReply = ''
            for await (const chunk of stream) {
              const content = String(chunk?.content ?? '')
              if (!content) continue
              fullReply += content
              controller.enqueue(write({ content, conversationId }))
            }
            await this.saveMessage(
              conversationId,
              'assistant',
              fullReply,
              estimateTokens(fullReply),
            )
            await this.lazyUpdateSummary(conversationId)
            controller.enqueue(write({ status: 'DONE', conversationId }))
            controller.close()
          } catch {
            controller.enqueue(
              write({
                status: 'ERROR',
                message: 'AI 对话失败',
                conversationId,
              }),
            )
            controller.close()
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      },
    )
  }

  public async getConversations(userId: string) {
    return this.conversationRepository.find({
      where: { userId },
      order: { createTime: 'DESC' },
    })
  }

  public async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
      userId,
    })
    if (!conversation)
      throw new BusinessException(`会话 ${conversationId} 不存在`)
    await this.conversationRepository.delete(conversationId)
    await this.messageRepository.delete({ conversationId })
    return '删除成功'
  }

  public async updateConversationTitle(
    data: { conversationId?: string; id?: string; title?: string },
    userId: string,
  ) {
    const conversationId = data.conversationId ?? data.id
    if (!conversationId || !data.title)
      throw new BusinessException('参数不完整')
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
      userId,
    })
    if (!conversation)
      throw new BusinessException(`会话 ${conversationId} 不存在`)
    conversation.title = data.title
    await this.conversationRepository.save(conversation)
    return '更新成功'
  }

  public async getMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
      userId,
    })
    if (!conversation)
      throw new BusinessException(`会话 ${conversationId} 不存在`)
    return this.messageRepository.find({
      where: { conversationId },
      order: { createTime: 'ASC' },
    })
  }

  private async prepareChatContext(data: ChatData, userId: string) {
    if (!userId) throw new BusinessException('用户信息不能为空')
    const userContent = data.message ?? data.prompt ?? ''
    if (!userContent) throw new BusinessException('消息不能为空')
    const conversationId = await this.ensureConversation(
      data.conversationId,
      userId,
      userContent,
    )
    await this.saveMessage(
      conversationId,
      'user',
      userContent,
      estimateTokens(userContent),
    )
    return { conversationId, userContent }
  }

  private async ensureConversation(
    conversationId: string | undefined,
    userId: string,
    userContent: string,
  ) {
    if (conversationId) {
      const conversation = await this.conversationRepository.findOneBy({
        id: conversationId,
        userId,
      })
      if (!conversation)
        throw new BusinessException(`会话 ${conversationId} 不存在`)
      return conversationId
    }
    const conversation = new AiConversationEntity()
    conversation.userId = userId
    conversation.title = userContent.slice(0, 20)
    conversation.status = CommonConstant.STATUS_NORMAL
    const saved = await this.conversationRepository.save(conversation)
    return saved.id
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokens = 0,
  ) {
    const entity = new AiMessageEntity()
    entity.conversationId = conversationId
    entity.role = role
    entity.content = content
    entity.tokens = tokens
    return this.messageRepository.save(entity)
  }

  private async buildContextMessages(conversationId: string) {
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
    })
    const latestMessages = await this.messageRepository.find({
      where: { conversationId },
      order: { createTime: 'DESC' },
      take: this.RECENT_MESSAGE_COUNT,
    })
    const messages: BaseMessage[] = [new SystemMessage(this.systemPrompt)]
    if (conversation?.summary)
      messages.push(new SystemMessage(`历史摘要：${conversation.summary}`))
    for (const item of latestMessages.reverse()) {
      if (item.role === 'user') messages.push(new HumanMessage(item.content))
      if (item.role === 'assistant') messages.push(new AIMessage(item.content))
    }
    return messages
  }

  private async lazyUpdateSummary(conversationId: string) {
    const count = await this.messageRepository.count({
      where: { conversationId },
    })
    if (
      count < this.SUMMARY_TRIGGER_COUNT ||
      (count - this.SUMMARY_TRIGGER_COUNT) % this.SUMMARY_TRIGGER_COUNT !== 0
    )
      return
    const summary = await this.generateSummary(conversationId)
    await this.conversationRepository.update(conversationId, { summary })
  }

  private async generateSummary(conversationId: string) {
    const conversation = await this.conversationRepository.findOneBy({
      id: Equal(conversationId),
    })
    const recent = await this.messageRepository.find({
      where: { conversationId },
      order: { createTime: 'DESC' },
      take: this.SUMMARY_TRIGGER_COUNT,
    })
    const newText = recent
      .reverse()
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n')
    if (!this.model)
      return `${conversation?.summary ? `${conversation.summary}\n` : ''}${newText}`.slice(
        -2000,
      )
    const template = buildSummaryPrompt(Boolean(conversation?.summary))
    return ChatPromptTemplate.fromTemplate(template)
      .pipe(this.model)
      .pipe(new StringOutputParser())
      .invoke({ existingSummary: conversation?.summary ?? '', newText })
  }

  private async appendToolResults(
    messages: BaseMessage[],
    content: string,
    enabled?: boolean,
  ) {
    if (!enabled) return
    const results = await runEnabledAiTools({ content })
    if (results.length) messages.push(new SystemMessage(results.join('\n')))
  }

  private createModel() {
    if (!this.config.openai?.apiKey) return null
    return new ChatOpenAI({
      apiKey: String(this.config.openai.apiKey),
      model: String(this.config.openai.model ?? 'gpt-4o-mini'),
      configuration: { baseURL: String(this.config.openai.baseURL ?? '') },
      temperature: Number(this.config.openai.temperature ?? 0.7),
      maxTokens: Number(this.config.openai.maxTokens ?? 1024),
    })
  }
}
