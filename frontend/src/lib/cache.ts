export class Cache<T> {
  private items: Map<string, { data: T; timestamp: number }> = new Map()
  private maxAge: number
  
  constructor(maxAge = 1000 * 60 * 5) { // 5 minutos por padrão
    this.maxAge = maxAge
  }
  
  set(key: string, data: T): void {
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
  
  clear(): void {
    this.items.clear()
  }
}
