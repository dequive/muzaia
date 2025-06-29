import { z } from 'zod'

// =============================================================================
// ENVIRONMENT SCHEMA VALIDATION
// =============================================================================

/**
 * Schema de validação para variáveis de ambiente
 */
const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_NAME: z.string().default('Mozaia'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('2.0.0'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_DEBUG: z.string().transform(val => val === 'true').default('false'),
  
  // API
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_TIMEOUT: z.string().transform(val => parseInt(val) || 60000).default('60000'),
  NEXT_PUBLIC_API_VERSION: z.string().default('v1'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // WebSocket
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  
  // CDN
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
  
  // Analytics
  NEXT_PUBLIC_GA_TRACKING_ID: z.string().optional(),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Features
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_REALTIME: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_DARK_MODE: z.string().transform(val => val !== 'false').default('true'),
  NEXT_PUBLIC_ENABLE_PWA: z.string().transform(val => val === 'true').default('false'),
  
  // Security
  NEXT_PUBLIC_CSP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Performance
  NEXT_PUBLIC_CACHE_ENABLED: z.string().transform(val => val !== 'false').default('true'),
  NEXT_PUBLIC_COMPRESSION_ENABLED: z.string().transform(val => val !== 'false').default('true'),
})

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Tipos para níveis de log
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Tipos para ambientes
 */
type Environment = 'development' | 'staging' | 'production'

/**
 * Tipos para temas
 */
type Theme = 'light' | 'dark' | 'system'

/**
 * Interface principal de configuração
 */
interface Config {
  app: {
    name: string
    version: string
    environment: Environment
    debug: boolean
    logLevel: LogLevel
    baseUrl: string
  }
  
  api: {
    baseUrl: string
    version: string
    timeout: number
    retries: number
    retryDelay: number
    headers: Record<string, string>
    endpoints: {
      auth: string
      chat: string
      users: string
      files: string
      analytics: string
    }
  }
  
  supabase: {
    url: string
    anonKey: string
    options: {
      auth: {
        autoRefreshToken: boolean
        persistSession: boolean
        detectSessionInUrl: boolean
      }
      realtime: {
        enabled: boolean
        heartbeatIntervalMs: number
      }
    }
  }
  
  websocket: {
    url?: string
    enabled: boolean
    reconnectAttempts: number
    reconnectDelay: number
    heartbeatInterval: number
  }
  
  cdn: {
    url?: string
    enabled: boolean
    domains: string[]
  }
  
  features: {
    analytics: boolean
    errorReporting: boolean
    realtime: boolean
    darkMode: boolean
    pwa: boolean
    notifications: boolean
    voiceCommands: boolean
    keyboardShortcuts: boolean
  }
  
  ui: {
    theme: Theme
    animationsEnabled: boolean
    soundEnabled: boolean
    notificationsEnabled: boolean
    compactMode: boolean
    sidebar: {
      collapsible: boolean
      defaultCollapsed: boolean
      width: number
    }
    chat: {
      showTypingIndicator: boolean
      showReadReceipts: boolean
      enableEmojis: boolean
      enableMarkdown: boolean
    }
  }
  
  chat: {
    maxMessageLength: number
    maxFileSize: number
    allowedFileTypes: string[]
    autoSave: boolean
    autoSaveInterval: number
    streamingEnabled: boolean
    maxHistorySize: number
    enableVoiceMessages: boolean
    enableVideoMessages: boolean
    compression: {
      enabled: boolean
      quality: number
    }
  }
  
  performance: {
    lazyLoading: boolean
    imageOptimization: boolean
    cacheTimeout: number
    preloadTimeout: number
    virtualScrolling: boolean
    debounceDelay: number
    throttleDelay: number
    maxCacheSize: number
  }
  
  security: {
    cspEnabled: boolean
    rateLimitEnabled: boolean
    maxRequestsPerMinute: number
    sessionTimeout: number
    encryptLocalStorage: boolean
    sanitizeInputs: boolean
  }
  
  analytics: {
    enabled: boolean
    providers: {
      googleAnalytics?: {
        id: string
        enabled: boolean
      }
      hotjar?: {
        id: string
        enabled: boolean
      }
      mixpanel?: {
        token: string
        enabled: boolean
      }
    }
    trackingOptions: {
      pageViews: boolean
      userInteractions: boolean
      errors: boolean
      performance: boolean
    }
  }
  
  errorReporting: {
    enabled: boolean
    dsn?: string
    environment: string
    sampleRate: number
    beforeSend?: (event: any) => any
  }
  
  cache: {
    enabled: boolean
    defaultTTL: number
    maxSize: number
    strategies: {
      api: 'memory' | 'localStorage' | 'indexedDB'
      images: 'memory' | 'localStorage' | 'indexedDB'
      static: 'memory' | 'localStorage' | 'indexedDB'
    }
  }
  
  monitoring: {
    enabled: boolean
    metricsInterval: number
    performanceObserver: boolean
    memoryTracking: boolean
  }
}

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Valida e parseia variáveis de ambiente
 */
function parseEnvironment() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Erro na validação das variáveis de ambiente:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

// Parse das variáveis de ambiente
const env = parseEnvironment()

// =============================================================================
// CONFIGURATION FACTORY
// =============================================================================

/**
 * Cria configuração baseada no ambiente
 */
function createConfig(): Config {
  const isDev = env.NEXT_PUBLIC_ENVIRONMENT === 'development'
  const isStaging = env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
  const isProd = env.NEXT_PUBLIC_ENVIRONMENT === 'production'
  
  return {
    app: {
      name: env.NEXT_PUBLIC_APP_NAME,
      version: env.NEXT_PUBLIC_APP_VERSION,
      environment: env.NEXT_PUBLIC_ENVIRONMENT,
      debug: env.NEXT_PUBLIC_DEBUG,
      logLevel: isDev ? 'debug' : isProd ? 'error' : 'info',
      baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
    },
    
    api: {
      baseUrl: env.NEXT_PUBLIC_API_URL,
      version: env.NEXT_PUBLIC_API_VERSION,
      timeout: env.NEXT_PUBLIC_API_TIMEOUT,
      retries: isDev ? 1 : 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': env.NEXT_PUBLIC_APP_VERSION,
        'X-Environment': env.NEXT_PUBLIC_ENVIRONMENT,
      },
      endpoints: {
        auth: '/auth',
        chat: '/chat',
        users: '/users',
        files: '/files',
        analytics: '/analytics',
      },
    },
    
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          enabled: env.NEXT_PUBLIC_ENABLE_REALTIME,
          heartbeatIntervalMs: 30000,
        },
      },
    },
    
    websocket: {
      url: env.NEXT_PUBLIC_WS_URL,
      enabled: !!env.NEXT_PUBLIC_WS_URL && env.NEXT_PUBLIC_ENABLE_REALTIME,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
    },
    
    cdn: {
      url: env.NEXT_PUBLIC_CDN_URL,
      enabled: !!env.NEXT_PUBLIC_CDN_URL,
      domains: env.NEXT_PUBLIC_CDN_URL ? [new URL(env.NEXT_PUBLIC_CDN_URL).hostname] : [],
    },
    
    features: {
      analytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      errorReporting: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
      realtime: env.NEXT_PUBLIC_ENABLE_REALTIME,
      darkMode: env.NEXT_PUBLIC_ENABLE_DARK_MODE,
      pwa: env.NEXT_PUBLIC_ENABLE_PWA,
      notifications: true,
      voiceCommands: false,
      keyboardShortcuts: true,
    },
    
    ui: {
      theme: 'system',
      animationsEnabled: !isDev, // Desabilita em dev para performance
      soundEnabled: false,
      notificationsEnabled: true,
      compactMode: false,
      sidebar: {
        collapsible: true,
        defaultCollapsed: false,
        width: 280,
      },
      chat: {
        showTypingIndicator: true,
        showReadReceipts: true,
        enableEmojis: true,
        enableMarkdown: true,
      },
    },
    
    chat: {
      maxMessageLength: 4000,
      maxFileSize: isProd ? 10 * 1024 * 1024 : 50 * 1024 * 1024, // 10MB prod, 50MB dev
      allowedFileTypes: [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/pdf',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
      ],
      autoSave: true,
      autoSaveInterval: 30000, // 30 segundos
      streamingEnabled: true,
      maxHistorySize: 1000,
      enableVoiceMessages: true,
      enableVideoMessages: false,
      compression: {
        enabled: true,
        quality: 0.8,
      },
    },
    
    performance: {
      lazyLoading: true,
      imageOptimization: true,
      cacheTimeout: isProd ? 5 * 60 * 1000 : 60 * 1000, // 5min prod, 1min dev
      preloadTimeout: 100,
      virtualScrolling: true,
      debounceDelay: 300,
      throttleDelay: 100,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
    },
    
    security: {
      cspEnabled: env.NEXT_PUBLIC_CSP_ENABLED,
      rateLimitEnabled: env.NEXT_PUBLIC_RATE_LIMIT_ENABLED,
      maxRequestsPerMinute: isDev ? 1000 : 100,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
      encryptLocalStorage: isProd,
      sanitizeInputs: true,
    },
    
    analytics: {
      enabled: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      providers: {
        ...(env.NEXT_PUBLIC_GA_TRACKING_ID && {
          googleAnalytics: {
            id: env.NEXT_PUBLIC_GA_TRACKING_ID,
            enabled: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
          },
        }),
        ...(env.NEXT_PUBLIC_HOTJAR_ID && {
          hotjar: {
            id: env.NEXT_PUBLIC_HOTJAR_ID,
            enabled: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
          },
        }),
      },
      trackingOptions: {
        pageViews: true,
        userInteractions: true,
        errors: true,
        performance: isProd,
      },
    },
    
    errorReporting: {
      enabled: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: env.NEXT_PUBLIC_ENVIRONMENT,
      sampleRate: isDev ? 0.1 : 1.0,
    },
    
    cache: {
      enabled: env.NEXT_PUBLIC_CACHE_ENABLED,
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100 * 1024 * 1024, // 100MB
      strategies: {
        api: 'memory',
        images: 'indexedDB',
        static: 'localStorage',
      },
    },
    
    monitoring: {
      enabled: isProd,
      metricsInterval: 60000, // 1 minuto
      performanceObserver: true,
      memoryTracking: isDev,
    },
  }
}

// =============================================================================
// CONFIGURATION INSTANCE
// =============================================================================

/**
 * Instância principal da configuração
 */
export const config = createConfig()

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Valida configuração completa
 */
export function validateConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validações críticas
  if (!config.supabase.url) {
    errors.push('Supabase URL é obrigatória')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('Supabase Anon Key é obrigatória')
  }
  
  if (!config.api.baseUrl) {
    errors.push('API Base URL é obrigatória')
  }
  
  // Validações de desenvolvimento
  if (config.app.environment === 'development') {
    if (config.features.analytics) {
      warnings.push('Analytics habilitado em desenvolvimento')
    }
    
    if (config.features.errorReporting) {
      warnings.push('Error reporting habilitado em desenvolvimento')
    }
  }
  
  // Validações de produção
  if (config.app.environment === 'production') {
    if (!config.features.analytics && config.analytics.enabled) {
      warnings.push('Analytics configurado mas feature desabilitada')
    }
    
    if (!config.security.cspEnabled) {
      warnings.push('CSP desabilitado em produção')
    }
    
    if (config.app.debug) {
      warnings.push('Debug habilitado em produção')
    }
  }
  
  // Validações de WebSocket
  if (config.features.realtime && !config.websocket.url) {
    warnings.push('Realtime habilitado mas WebSocket URL não configurada')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Valida configuração na inicialização
 */
export function initializeConfig(): void {
  const validation = validateConfig()
  
  if (!validation.isValid) {
    console.error('❌ Configuração inválida:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Avisos de configuração:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (config.app.debug) {
    console.log('🔧 Configuração carregada:', {
      app: config.app.name,
      version: config.app.version,
      environment: config.app.environment,
      api: config.api.baseUrl,
      features: Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature),
    })
  }
}

// =============================================================================
// ENVIRONMENT HELPERS
// =============================================================================

/**
 * Helpers para ambiente
 */
export const isDev = config.app.environment === 'development'
export const isStaging = config.app.environment === 'staging'
export const isProd = config.app.environment === 'production'
export const isDebug = config.app.debug

/**
 * Helper para verificar feature flags
 */
export function isFeatureEnabled(feature: keyof Config['features']): boolean {
  return config.features[feature]
}

/**
 * Helper para obter configuração de API
 */
export function getApiUrl(endpoint?: keyof Config['api']['endpoints']): string {
  const baseUrl = `${config.api.baseUrl}/${config.api.version}`
  
  if (!endpoint) return baseUrl
  
  return `${baseUrl}${config.api.endpoints[endpoint]}`
}

/**
 * Helper para obter configuração de CDN
 */
export function getCdnUrl(path: string = ''): string {
  if (!config.cdn.enabled || !config.cdn.url) {
    return path
  }
  
  return `${config.cdn.url}${path.startsWith('/') ? path : `/${path}`}`
}

// =============================================================================
// RUNTIME CONFIGURATION
// =============================================================================

/**
 * Configurações que podem ser alteradas em runtime
 */
class RuntimeConfig {
  private static instance: RuntimeConfig
  private config: Partial<Config> = {}
  private listeners: Array<(config: Partial<Config>) => void> = []
  
  static getInstance(): RuntimeConfig {
    if (!RuntimeConfig.instance) {
      RuntimeConfig.instance = new RuntimeConfig()
    }
    return RuntimeConfig.instance
  }
  
  /**
   * Atualiza configuração em runtime
   */
  update(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates }
    this.listeners.forEach(listener => listener(this.config))
    
    if (isDebug) {
      console.log('🔄 Configuração atualizada:', updates)
    }
  }
  
  /**
   * Obtém configuração atual
   */
  get<K extends keyof Config>(key: K): Config[K] {
    return (this.config[key] as Config[K]) || config[key]
  }
  
  /**
   * Inscreve listener para mudanças
   */
  subscribe(listener: (config: Partial<Config>) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
  
  /**
   * Reseta configuração para padrões
   */
  reset(): void {
    this.config = {}
    this.listeners.forEach(listener => listener({}))
  }
}

export const runtimeConfig = RuntimeConfig.getInstance()

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * Gerenciador de preferências do usuário
 */
export class UserPreferences {
  private static readonly STORAGE_KEY = 'mozaia:user-preferences'
  
  /**
   * Salva preferências do usuário
   */
  static save(preferences: Partial<Config['ui']>): void {
    try {
      const current = this.load()
      const updated = { ...current, ...preferences }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
      
      // Atualiza configuração runtime
      runtimeConfig.update({ ui: updated })
      
      if (isDebug) {
        console.log('💾 Preferências salvas:', preferences)
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
    }
  }
  
  /**
   * Carrega preferências do usuário
   */
  static load(): Partial<Config['ui']> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
      return {}
    }
  }
  
  /**
   * Remove todas as preferências
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      runtimeConfig.update({ ui: config.ui })
      
      if (isDebug) {
        console.log('🗑️  Preferências removidas')
      }
    } catch (error) {
      console.error('Erro ao limpar preferências:', error)
    }
  }
  
  /**
   * Obtém preferência específica
   */
  static get<K extends keyof Config['ui']>(key: K): Config['ui'][K] {
    const preferences = this.load()
    return preferences[key] ?? config.ui[key]
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default config

export type {
  Config,
  Environment,
  LogLevel,
  Theme,
}

export {
  env,
  getApiUrl,
  getCdnUrl,
  isFeatureEnabled,
  initializeConfig,
  validateConfig,
}

// Auto-initialize em produção
if (typeof window !== 'undefined' && isProd) {
  initializeConfig()
}
