import type { AppServices, AuthUser } from './context'

/** 通用查询参数类型（URL Query 解析后的值都是字符串或 undefined） */
export type QueryParams = Record<string, string | undefined>

/** 通用路由路径参数类型 */
export type RouteParams = Record<string, string | undefined>

/** 带单个 id 的查询参数 */
export interface IdQuery {
  id?: string
}

/** 带 ids 的查询参数，支持逗号分隔字符串或字符串数组 */
export interface IdsQuery {
  ids?: string | string[]
}

/** 分页查询基础参数 */
export interface PageQuery {
  pageNo?: string
  pageNum?: string
  pageSize?: string
}

/** 通用删除/批量操作参数，兼容 id、ids、jobIds、logIds 等历史字段 */
export interface IdsPayload {
  id?: string
  ids?: string | string[]
  jobIds?: string | string[]
  logIds?: string | string[]
}

export interface RouteContext<Body = unknown, Query = QueryParams, Params = RouteParams> {
  body: Body
  query: Query
  params: Params
  request: Request
  path: string
  set: { headers: Record<string, string>; status?: number }
  server?: { requestIP?: (request: Request) => { address?: string } | null }
  requestId: string
  services: AppServices
  user?: AuthUser
}

/** 已登录用户的路由上下文，user 必填 */
export type AuthedRouteContext<Body = unknown, Query = QueryParams, Params = RouteParams> = RouteContext<Body, Query, Params> & {
  user: AuthUser
}

export type RouteHandler<Body = unknown, Query = QueryParams, Params = RouteParams, Result = unknown> = (
  context: RouteContext<Body, Query, Params>,
) => Result
