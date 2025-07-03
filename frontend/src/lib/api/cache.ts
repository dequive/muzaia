// Cache Manager com tipagem forte e funcionalidades avançadas
export class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private provider: 'memory' | 'localStorage' | 'indexedDB'
  private maxSize: number
  private defaultTTL: number
  private hits = 0
  private misses = 0

  constructor(
    provider: 'memory' | 'localStorage' | 'indexedDB' = 'memory',
    maxSize: number = 100,
    defaultTTL: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.provider = provider
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    
    // Cleanup periódico
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  // ... resto do código do CacheManager
}
