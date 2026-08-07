import type { PageQuery } from '../../../core/route-context'

export interface PromptListQuery extends PageQuery {
  title?: string
  type?: string
  status?: string
}

export interface CreatePromptBody {
  title: string
  type: string
  status?: string
  remark?: string
  content: string
}

export interface UpdatePromptBody extends Partial<CreatePromptBody> {
  id: string
}
