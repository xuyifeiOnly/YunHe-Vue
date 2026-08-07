import type { RouteContext } from '../../core/route-context'
import { assertRecord, parseBoolean, parseString } from '../../core/validation'
import type { AppLike, RouteDefinition } from '../../routes/meta'
import { registerRouteDefinitions } from '../../routes/meta'

type ChatBody = { message?: string; prompt?: string; conversationId?: string; enableInternetSearch?: boolean }
type ConversationQuery = { conversationId?: string; id?: string }
type UpdateTitleBody = { conversationId?: string; id?: string; title?: string }

function parseChatBody(body: unknown): ChatBody {
  const data = assertRecord(body)
  const message = parseString(data.message, '消息')
  const prompt = parseString(data.prompt, '提示词')
  if (!message && !prompt) parseString(undefined, '消息', { required: true })
  return {
    message,
    prompt,
    conversationId: parseString(data.conversationId, '会话ID'),
    enableInternetSearch: parseBoolean(data.enableInternetSearch, '联网搜索', false),
  }
}

function parseUpdateTitleBody(body: unknown): UpdateTitleBody {
  const data = assertRecord(body)
  return {
    conversationId: parseString(data.conversationId, '会话ID'),
    id: parseString(data.id, '会话ID'),
    title: parseString(data.title, '会话标题', { required: true, max: 50 }),
  }
}

function parseConversationIdQuery(query: ConversationQuery) {
  return parseString(query.conversationId ?? query.id, '会话ID', { required: true })
}

const routes = [
  { method: 'POST', path: '/ai/chat', description: 'AI 对话', handler: ({ body, services, user }: RouteContext<ChatBody>) => services.aiService.chat(parseChatBody(body), user!.userId) },
  { method: 'POST', path: '/ai/chat/stream', description: 'AI SSE 对话', handler: ({ body, services, user }: RouteContext<ChatBody>) => services.aiService.stream(parseChatBody(body), user!.userId) },
  { method: 'GET', path: '/ai/conversation/list', description: 'AI 会话列表', handler: ({ services, user }: RouteContext) => services.aiService.getConversations(user!.userId) },
  { method: 'DELETE', path: '/ai/conversation/delete', description: 'AI 会话删除', handler: ({ query, services, user }: RouteContext<unknown, ConversationQuery>) => services.aiService.deleteConversation(parseConversationIdQuery(query), user!.userId) },
  { method: 'PUT', path: '/ai/conversation/updateTitle', description: 'AI 会话标题更新', handler: ({ body, services, user }: RouteContext<UpdateTitleBody>) => services.aiService.updateConversationTitle(parseUpdateTitleBody(body), user!.userId) },
  { method: 'GET', path: '/ai/message/list', description: 'AI 消息列表', handler: ({ query, services, user }: RouteContext<unknown, ConversationQuery>) => services.aiService.getMessages(parseConversationIdQuery(query), user!.userId) },
] satisfies RouteDefinition[]

export function registerRoutes(app: AppLike) {
  registerRouteDefinitions(app, routes)
}
