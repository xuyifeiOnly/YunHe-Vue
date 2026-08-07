import type { createServices } from './services'

export type AppServices = ReturnType<typeof createServices>

export interface JwtPayload {
  userId: string
  username: string
  uuid: string
}

export interface AuthUser extends JwtPayload {
  token: string
}
