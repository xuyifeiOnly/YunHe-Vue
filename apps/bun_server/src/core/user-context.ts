import { AsyncLocalStorage } from 'node:async_hooks'

interface UserContextStore {
  username?: string
}

export class UserContext {
  private static readonly storage = new AsyncLocalStorage<UserContextStore>()

  static setCurrentUser(username: string): void {
    const store = this.storage.getStore() ?? {}
    store.username = username
    this.storage.enterWith(store)
  }

  static getCurrentUsername(): string {
    return this.storage.getStore()?.username ?? 'admin'
  }
}
