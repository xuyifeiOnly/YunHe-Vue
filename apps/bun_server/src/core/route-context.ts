import type { AppServices, AuthUser } from './context'

export interface RouteContext<Body = unknown, Query = Record<string, string | undefined>, Params = Record<string, string | undefined>> {
  body: Body
  query: Query
  params: Params
  request: Request
  server?: { requestIP?: (request: Request) => { address?: string } | null }
  requestId: string
  services: AppServices
  user?: AuthUser
}

export type RouteHandler<Body = unknown, Query = Record<string, string | undefined>, Params = Record<string, string | undefined>, Result = unknown> = (context: RouteContext<Body, Query, Params>) => Result
