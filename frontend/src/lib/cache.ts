export interface CacheOptions {
  maxAge?: number // em milissegundos
  maxSize?: number // número máximo de itens
}

export class Cache<T> {
  private items = new Map<string, { data: T; timestamp: number }>()
  private readonly maxAge: number
  private readonly maxSize: number

  constructor(options: CacheOptions = {}) {
    this.maxAge = options.maxAge ?? 5 * 60 * 1000 // 5 minutos default
    this.maxSize = options.maxSize ?? 1000
  }

  set(key: string, data: T): void {
    // Limpar cache se exceder tamanho máximo
    if (this.items.size >= this.maxSize) {
      const oldestKey = Array.from(this.items.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0]
      this.items.delete(oldestKey)
    }

    this.items.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): T | null {
    const item = this.items.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.maxAge) {
      this.items.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.items.clear()
  }

  size(): number {
    return this.items.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.items.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.items.delete(key)
      }
    }
  }
}

// Cache global singleton
export const globalCache = {
  conversations: new Cache<Conversation[]>({ maxAge: 30 * 60 * 1000 }), // 30 min
  messages: new Cache<Message[]>({ maxAge: 15 * 60 * 1000 }), // 15 min
  users: new Cache<User>({ maxAge: 60 * 60 * 1000 }) // 1 hora
}
