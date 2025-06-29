import { describe, it, expect, beforeEach, vi } from 'vitest'
import { config, validateConfig, isFeatureEnabled, getApiUrl, getCdnUrl, UserPreferences } from './config'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_APP_NAME: 'Mozaia Test',
  NEXT_PUBLIC_APP_VERSION: '2.0.0-test',
  NEXT_PUBLIC_ENVIRONMENT: 'development',
  NEXT_PUBLIC_DEBUG: 'true',
  NEXT_PUBLIC_API_URL: 'https://api.test.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: 'false',
  NEXT_PUBLIC_ENABLE_REALTIME: 'true',
  NEXT_PUBLIC_ENABLE_DARK_MODE: 'true',
}

describe('Config', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      env: mockEnv
    })
  })

  describe('Basic Configuration', () => {
    it('should load app configuration correctly', () => {
      expect(config.app.name).toBe('Mozaia Test')
      expect(config.app.version).toBe('2.0.0-test')
      expect(config.app.environment).toBe('development')
      expect(config.app.debug).toBe(true)
    })

    it('should load API configuration correctly', () => {
      expect(config.api.baseUrl).toBe('https://api.test.com')
      expect(config.api.version).toBe('v1')
      expect(config.api.timeout).toBe(60000)
    })

    it('should load Supabase configuration correctly', () => {
      expect(config.supabase.url).toBe('https://test.supabase.co')
      expect(config.supabase.anonKey).toBe('test-anon-key')
      expect(config.supabase.options.auth.autoRefreshToken).toBe(true)
    })
  })

  describe('Feature Flags', () => {
    it('should check feature flags correctly', () => {
      expect(isFeatureEnabled('analytics')).toBe(false)
      expect(isFeatureEnabled('errorReporting')).toBe(false)
      expect(isFeatureEnabled('realtime')).toBe(true)
      expect(isFeatureEnabled('darkMode')).toBe(true)
    })
  })

  describe('API URL Helper', () => {
    it('should generate base API URL', () => {
      expect(getApiUrl()).toBe('https://api.test.com/v1')
    })

    it('should generate endpoint URLs', () => {
      expect(getApiUrl('auth')).toBe('https://api.test.com/v1/auth')
      expect(getApiUrl('chat')).toBe('https://api.test.com/v1/chat')
      expect(getApiUrl('users')).toBe('https://api.test.com/v1/users')
    })
  })

  describe('CDN URL Helper', () => {
    it('should return original path when CDN is disabled', () => {
      expect(getCdnUrl('/image.jpg')).toBe('/image.jpg')
      expect(getCdnUrl('assets/icon.png')).toBe('/assets/icon.png')
    })

    it('should generate CDN URLs when enabled', () => {
      // Mock CDN configuration
      const originalCdn = config.cdn
      config.cdn.enabled = true
      config.cdn.url = 'https://cdn.test.com'

      expect(getCdnUrl('/image.jpg')).toBe('https://cdn.test.com/image.jpg')
      expect(getCdnUrl('assets/icon.png')).toBe('https://cdn.test.com/assets/icon.png')

      // Restore original
      config.cdn = originalCdn
    })
  })

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const validation = validateConfig()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      // Mock missing Supabase URL
      const originalUrl = config.supabase.url
      config.supabase.url = ''

      const validation = validateConfig()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Supabase URL é obrigatória')

      // Restore original
      config.supabase.url = originalUrl
    })

    it('should generate warnings for development environment', () => {
      // Mock analytics enabled in development
      const originalAnalytics = config.features.analytics
      config.features.analytics = true

      const validation = validateConfig()
      expect(validation.warnings).toContain('Analytics habilitado em desenvolvimento')

      // Restore original
      config.features.analytics = originalAnalytics
    })
  })

  describe('User Preferences', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', localStorageMock)
    })

    it('should save user preferences', () => {
      const preferences = { theme: 'dark' as const, animationsEnabled: false }
      
      UserPreferences.save(preferences)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mozaia:user-preferences',
        JSON.stringify(preferences)
      )
    })

    it('should load user preferences', () => {
      const mockPreferences = { theme: 'dark', soundEnabled: true }
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockPreferences))
      
      const loaded = UserPreferences.load()
      
      expect(loaded).toEqual(mockPreferences)
      expect(localStorage.getItem).toHaveBeenCalledWith('mozaia:user-preferences')
    })

    it('should handle localStorage errors gracefully', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const loaded = UserPreferences.load()
      
      expect(loaded).toEqual({})
    })

    it('should clear user preferences', () => {
      UserPreferences.clear()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('mozaia:user-preferences')
    })

    it('should get specific preference with fallback', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      
      const theme = UserPreferences.get('theme')
      
      expect(theme).toBe(config.ui.theme)
    })
  })

  describe('Environment Detection', () => {
    it('should detect development environment correctly', () => {
      expect(config.app.environment).toBe('development')
      expect(config.app.debug).toBe(true)
      expect(config.app.logLevel).toBe('debug')
    })

    it('should apply development-specific settings', () => {
      expect(config.api.retries).toBe(1) // Less retries in dev
      expect(config.chat.maxFileSize).toBeGreaterThan(10 * 1024 * 1024) // Larger files in dev
      expect(config.security.maxRequestsPerMinute).toBe(1000) // Higher rate limit in dev
    })
  })

  describe('Chat Configuration', () => {
    it('should have correct chat settings', () => {
      expect(config.chat.maxMessageLength).toBe(4000)
      expect(config.chat.autoSave).toBe(true)
      expect(config.chat.streamingEnabled).toBe(true)
      expect(config.chat.allowedFileTypes).toContain('text/plain')
      expect(config.chat.allowedFileTypes).toContain('image/jpeg')
      expect(config.chat.allowedFileTypes).toContain('application/pdf')
    })
  })

  describe('Performance Configuration', () => {
    it('should have optimized performance settings', () => {
      expect(config.performance.lazyLoading).toBe(true)
      expect(config.performance.imageOptimization).toBe(true)
      expect(config.performance.virtualScrolling).toBe(true)
      expect(config.performance.debounceDelay).toBe(300)
      expect(config.performance.throttleDelay).toBe(100)
    })
  })

  describe('Security Configuration', () => {
    it('should have appropriate security settings', () => {
      expect(config.security.sanitizeInputs).toBe(true)
      expect(config.security.sessionTimeout).toBe(24 * 60 * 60 * 1000) // 24 hours
    })

    it('should adjust security based on environment', () => {
      // In development, encryption should be disabled for easier debugging
      expect(config.security.encryptLocalStorage).toBe(false)
      
      // Rate limiting should be more permissive in development
      expect(config.security.maxRequestsPerMinute).toBe(1000)
    })
  })
})
