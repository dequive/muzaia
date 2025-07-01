import { z } from "zod";

// =============================================================================
// SCHEMAS COMPOSTOS
// =============================================================================

const UrlSchema = z.string().url({ message: "URL inválida" });
const RequiredStringSchema = z.string().min(1, { message: "Campo obrigatório" });
const PositiveNumberSchema = z.number().positive({ message: "Deve ser positivo" });

const EnvironmentSchema = z.enum(["development", "staging", "production", "test"], {
  errorMap: () => ({ message: "Ambiente deve ser development, staging, production ou test" })
});

// =============================================================================
// SCHEMA PRINCIPAL
// =============================================================================

const ConfigSchema = z.object({
  app: z.object({
    name: RequiredStringSchema,
    version: RequiredStringSchema,
    environment: EnvironmentSchema,
    debug: z.boolean().default(false),
  }),
  
  supabase: z.object({
    url: UrlSchema,
    anonKey: RequiredStringSchema,
  }),
  
  api: z.object({
    baseUrl: UrlSchema,
    version: z.string().default("v1"),
    timeout: PositiveNumberSchema.default(60000),
    retries: z.number().min(0).max(5).default(3),
    endpoints: z.object({
      auth: z.string().default("/auth"),
      chat: z.string().default("/chat"),
      users: z.string().default("/users"),
      orchestrator: z.string().default("/orchestrator"),
    }).optional(),
  }),
  
  websocket: z.object({
    url: UrlSchema.optional(),
    reconnectInterval: PositiveNumberSchema.default(5000),
    maxReconnects: z.number().min(0).default(10),
  }).optional(),
  
  features: z.object({
    analytics: z.boolean().default(false),
    errorReporting: z.boolean().default(false),
    realtime: z.boolean().default(true),
    darkMode: z.boolean().default(true),
    notifications: z.boolean().default(true),
    voiceCommands: z.boolean().default(false),
    keyboardShortcuts: z.boolean().default(true),
  }),
  
  security: z.object({
    cspEnabled: z.boolean().default(true),
    maxRequestsPerMinute: PositiveNumberSchema.default(100),
    sessionTimeout: PositiveNumberSchema.default(24 * 60 * 60 * 1000),
    encryptLocalStorage: z.boolean().default(true),
  }),
  
  chat: z.object({
    maxMessageLength: PositiveNumberSchema.default(4000),
    maxFileSize: PositiveNumberSchema.default(10 * 1024 * 1024),
    allowedFileTypes: z.array(z.string()).default([
      'text/plain', 'text/markdown', 'image/jpeg', 
      'image/png', 'image/webp', 'application/pdf'
    ]),
    streamingEnabled: z.boolean().default(true),
    autoSave: z.boolean().default(true),
  }),
  
  performance: z.object({
    lazyLoading: z.boolean().default(true),
    imageOptimization: z.boolean().default(true),
    virtualScrolling: z.boolean().default(true),
    debounceDelay: PositiveNumberSchema.default(300),
    throttleDelay: PositiveNumberSchema.default(100),
  }),
});

// =============================================================================
// INTERFACE TIPADA
// =============================================================================

export type Config = z.infer<typeof ConfigSchema>;

// =============================================================================
// FUNÇÃO DE VALIDAÇÃO EVOLUÍDA
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: Config;
}

export function validateConfig(configInput: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validação estrutural com Zod
  const parseResult = ConfigSchema.safeParse(configInput);
  
  if (!parseResult.success) {
    errors.push(...parseResult.error.errors.map(e => 
      `${e.path.join('.')}: ${e.message}`
    ));
    return { isValid: false, errors, warnings };
  }
  
  const config = parseResult.data;
  
  // 2. Validações de contexto e negócio
  validateBusinessRules(config, warnings, errors);
  
  // 3. Validações específicas por ambiente
  validateEnvironmentSpecific(config, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

// =============================================================================
// VALIDAÇÕES DE NEGÓCIO
// =============================================================================

function validateBusinessRules(config: Config, warnings: string[], errors: string[]): void {
  // Validações de dependências
  if (config.features.realtime && !config.websocket?.url) {
    warnings.push("Realtime habilitado mas WebSocket URL não configurada");
  }
  
  if (config.features.analytics && !process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
    warnings.push("Analytics habilitado mas GA_TRACKING_ID não configurado");
  }
  
  // Validações de performance
  if (config.chat.maxMessageLength > 10000) {
    warnings.push("Tamanho máximo de mensagem muito alto (>10k caracteres)");
  }
  
  if (config.chat.maxFileSize > 50 * 1024 * 1024) {
    warnings.push("Tamanho máximo de arquivo muito alto (>50MB)");
  }
  
  // Validações de segurança
  if (config.security.maxRequestsPerMinute > 10000) {
    warnings.push("Rate limit muito alto para produção");
  }
  
  if (config.api.timeout > 120000) {
    warnings.push("Timeout de API muito alto (>2min)");
  }
}

// =============================================================================
// VALIDAÇÕES POR AMBIENTE
// =============================================================================

function validateEnvironmentSpecific(config: Config, warnings: string[]): void {
  const { environment } = config.app;
  
  if (environment === "development") {
    if (config.features.analytics) {
      warnings.push("Analytics habilitado em desenvolvimento");
    }
    
    if (config.features.errorReporting) {
      warnings.push("Error reporting habilitado em desenvolvimento");
    }
    
    if (!config.app.debug) {
      warnings.push("Debug desabilitado em desenvolvimento");
    }
  }
  
  if (environment === "production") {
    if (config.app.debug) {
      warnings.push("Debug habilitado em produção");
    }
    
    if (!config.security.cspEnabled) {
      warnings.push("CSP desabilitado em produção");
    }
    
    if (!config.security.encryptLocalStorage) {
      warnings.push("Criptografia de localStorage desabilitada em produção");
    }
    
    if (config.security.maxRequestsPerMinute > 1000) {
      warnings.push("Rate limit muito permissivo para produção");
    }
  }
  
  if (environment === "test") {
    if (config.features.analytics) {
      warnings.push("Analytics habilitado em ambiente de teste");
    }
  }
}

// =============================================================================
// UTILITÁRIOS ADICIONAIS
// =============================================================================

export function getConfigDefaults(): Partial<Config> {
  return ConfigSchema.parse({});
}

export function mergeConfig(base: Config, overrides: Partial<Config>): Config {
  const merged = { ...base, ...overrides };
  const result = validateConfig(merged);
  
  if (!result.isValid) {
    throw new Error(`Configuração inválida: ${result.errors.join(', ')}`);
  }
  
  return result.config!;
}

export function createConfigFromEnv(): Config {
  const envConfig = {
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '60000'),
    },
    features: {
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
      realtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
      darkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== 'false',
    },
    // ... mais campos conforme necessário
  };
  
  const result = validateConfig(envConfig);
  
  if (!result.isValid) {
    console.error('❌ Configuração de ambiente inválida:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Avisos de configuração:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  return result.config!;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ConfigSchema };
export default validateConfig;
