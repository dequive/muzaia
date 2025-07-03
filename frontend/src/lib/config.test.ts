import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { config, validateConfig, type Config } from './config'

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('Environment Detection', () => {
    it('should detect correct environment', () => {
      expect(['development', 'test', 'production']).toContain(config.environment)
    })

    it('should apply environment-specific settings', () => {
      if (config.environment === 'development') {
        expect(config.security.ssl).toBe(false)
        expect(config.monitoring.analytics).toBe(false)
      }

      if (config.environment === 'production') {
        expect(config.security.ssl).toBe(true)
        expect(config.security.cspEnabled).toBe(true)
      }
    })
  })

  describe('Security Configuration', () => {
    it('should have secure defaults', () => {
      expect(config.security.cspEnabled).toBe(true)
      expect(config.security.encryptLocalStorage).toBe(true)
      expect(config.security.maxRequestsPerMinute).toBeLessThanOrEqual(10000)
    })

    it('should validate rate limits', () => {
      const testConfig: Config = {
        ...config,
        environment: 'production',
        security: {
          ...config.security,
          maxRequestsPerMinute: 20000
        }
      }

      const validation = validateConfig(testConfig)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Rate limit muito alto para produção')
    })
  })

  describe('API Configuration', () => {
    it('should have valid API settings', () => {
      expect(config.api.baseUrl).toMatch(/^https?:\/\//)
      expect(config.api.timeout).toBeGreaterThan(0)
      expect(config.api.retries).toBeGreaterThanOrEqual(0)
    })

    it('should validate API timeout', () => {
      const testConfig: Config = {
        ...config,
        api: {
          ...config.api,
          timeout: 120000 // 2 minutes
        }
      }

      const validation = validateConfig(testConfig)
      expect(validation.warnings).toContain('Timeout da API muito alto (>30s)')
    })
  })

  describe('Chat Configuration', () => {
    it('should have valid chat settings', () => {
      expect(config.chat.maxMessageLength).toBeLessThanOrEqual(10000)
      expect(config.chat.maxFileSize).toBeLessThanOrEqual(50 * 1024 * 1024)
      expect(config.chat.allowedFileTypes).toContain('text/plain')
    })

    it('should validate message length', () => {
      const testConfig: Config = {
        ...config,
        chat: {
          ...config.chat,
          maxMessageLength: 20000
        }
      }

      const validation = validateConfig(testConfig)
      expect(validation.warnings).toContain('Tamanho máximo de mensagem muito alto (>4k caracteres)')
    })
  })

  describe('Cache Configuration', () => {
    it('should have valid cache settings', () => {
      expect(config.cache.enabled).toBeDefined()
      expect(config.cache.ttl).toBeGreaterThan(0)
      expect(config.cache.maxSize).toBeGreaterThan(0)
    })

    it('should have valid cache strategy', () => {
      expect(['memory', 'localStorage', 'indexedDB']).toContain(config.cache.strategy)
    })
  })

  describe('Monitoring Configuration', () => {
    it('should have valid monitoring settings', () => {
      expect(config.monitoring.enabled).toBeDefined()
      expect(config.monitoring.errorReporting).toBeDefined()
      expect(config.monitoring.analytics).toBeDefined()
    })

    it('should disable analytics in development', () => {
      if (config.environment === 'development') {
        expect(config.monitoring.analytics).toBe(false)
      }
    })
  })
})
