import { z } from 'zod'
import deepmerge from 'deepmerge'

// Esquemas de validação
const EnvironmentSchema = z.enum(['development', 'test', 'production'])

const SecurityConfigSchema = z.object({
  ssl: z.boolean(),
  cspEnabled: z.boolean(),
  maxRequestsPerMinute: z.number().min(1).max(10000),
  encryptLocalStorage: z.boolean(),
  allowedOrigins: z.array(z.string().url()),
  rateLimiting: z.object({
    enabled: z.boolean(),
    windowMs: z.number().min(1000),
    maxRequests: z.number().min(1)
  })
})

const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().min(1000).max(60000),
  retries: z.number().min(0).max(5),
  batchingEnabled: z.boolean(),
  compressionEnabled: z.boolean()
})

const ChatConfigSchema = z.object({
  maxMessageLength: z.number().min(1).max(10000),
  maxFileSize: z.number().min(1).max(50 * 1024 * 1024), // 50MB
  allowedFileTypes: z.array(z.string()),
  autoSave: z.boolean(),
  streamingEnabled: z.boolean()
})

const CacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().min(0),
  maxSize: z.number().min(0),
  strategy: z.enum(['memory', 'localStorage', 'indexedDB'])
})

const MonitoringConfigSchema = z.object({
  enabled: z.boolean(),
  errorReporting: z.boolean(),
  analytics: z.boolean(),
  performanceMonitoring: z.boolean()
})

const ConfigSchema = z.object({
  environment: EnvironmentSchema,
  security: SecurityConfigSchema,
  api: ApiConfigSchema,
  chat: ChatConfigSchema,
  cache: CacheConfigSchema,
  monitoring: MonitoringConfigSchema
})

type Config = z.infer<typeof ConfigSchema>

// Configurações base
const baseConfig: Config = {
  environment: process.env.NODE_ENV as 'development' | 'test' | 'production',
  security: {
    ssl: true,
    cspEnabled: true,
    maxRequestsPerMinute: 1000,
    encryptLocalStorage: true,
    allowedOrigins: ['https://mozaia.mz'],
    rateLimiting: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100
    }
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.mozaia.mz',
    timeout: 30000,
    retries: 3,
    batchingEnabled: true,
    compressionEnabled: true
  },
  chat: {
    maxMessageLength: 4000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['text/plain', 'image/jpeg', 'image/png', 'application/pdf'],
    autoSave: true,
    streamingEnabled: true
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100,
    strategy: 'memory'
  },
  monitoring: {
    enabled: true,
    errorReporting: true,
    analytics: false,
    performanceMonitoring: true
  }
}

// Configurações específicas por ambiente
const envConfigs: Record<Config['environment'], Partial<Config>> = {
  development: {
    security: {
      maxRequestsPerMinute: 10000,
      ssl: false
    },
    monitoring: {
      analytics: false
    }
  },
  test: {
    security: {
      maxRequestsPerMinute: 0, // Sem limite
      ssl: false
    },
    monitoring: {
      enabled: false
    }
  },
  production: {
    security: {
      ssl: true,
      cspEnabled: true,
      maxRequestsPerMinute: 1000,
      encryptLocalStorage: true
    },
    monitoring: {
      enabled: true,
      analytics: true
    }
  }
}

// Função de validação
export function validateConfig(config: Config): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    ConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`))
    }
  }

  // Validações específicas por ambiente
  if (config.environment === 'production') {
    if (!config.security.ssl) {
      errors.push('SSL deve estar habilitado em produção')
    }
    if (!config.security.cspEnabled) {
      errors.push('CSP deve estar habilitado em produção')
    }
    if (config.security.maxRequestsPerMinute > 1000) {
      errors.push('Rate limit muito alto para produção')
    }
    if (!config.security.encryptLocalStorage) {
      errors.push('Criptografia de localStorage deve estar habilitada em produção')
    }
  }

  // Warnings gerais
  if (config.chat.maxMessageLength > 4000) {
    warnings.push('Tamanho máximo de mensagem muito alto (>4k caracteres)')
  }
  if (config.chat.maxFileSize > 10 * 1024 * 1024) {
    warnings.push('Tamanho máximo de arquivo muito alto (>10MB)')
  }
  if (config.api.timeout > 30000) {
    warnings.push('Timeout da API muito alto (>30s)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Criar configuração final
const envConfig = envConfigs[baseConfig.environment] || {}
const config = deepmerge(baseConfig, envConfig)

// Validar configuração
const validation = validateConfig(config)

if (!validation.isValid) {
  console.error('❌ Configuração inválida:')
  validation.errors.forEach(error => console.error(`- ${error}`))
  throw new Error('Invalid configuration')
}

if (validation.warnings.length > 0) {
  console.warn('⚠️ Avisos de configuração:')
  validation.warnings.forEach(warning => console.warn(`- ${warning}`))
}

export { config, type Config }
export const isDev = config.environment === 'development'
export const isProd = config.environment === 'production'
export const isTest = config.environment === 'test'
