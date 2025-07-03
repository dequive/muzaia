export interface ApiClientConfig {
  baseURL: string
  timeout: number
  retries: number
  cache: {
    enabled: boolean
    provider: 'memory' | 'localStorage' | 'indexedDB'
    maxSize: number
    defaultTTL: number
  }
  rateLimiting: {
    enabled: boolean
    windowMs: number
    maxRequests: number
  }
  monitoring: {
    enabled: boolean
    maxMetrics: number
  }
  security: {
    encryptStorage: boolean
    validateSSL: boolean
  }
}

export const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000,
  retries: 3,
  cache: {
    enabled: true,
    provider: 'memory',
    maxSize: 100,
    defaultTTL: 300000 // 5 minutes
  },
  rateLimiting: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 60
  },
  monitoring: {
    enabled: true,
    maxMetrics: 1000
  },
  security: {
    encryptStorage: true,
    validateSSL: true
  }
}
