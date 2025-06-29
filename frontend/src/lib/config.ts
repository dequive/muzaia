// Configuration for Mozaia Frontend

interface Config {
  app: {
    name: string;
    version: string;
    environment: string;
    debug: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    analytics: boolean;
    errorReporting: boolean;
    realtime: boolean;
    darkMode: boolean;
  };
  ui: {
    animationsEnabled: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
  chat: {
    maxMessageLength: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    autoSave: boolean;
    streamingEnabled: boolean;
  };
  performance: {
    lazyLoading: boolean;
    imageOptimization: boolean;
    cacheTimeout: number;
  };
}

const config: Config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Mozaia',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '60000'),
    retries: 3,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    realtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
    darkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== 'false',
  },
  ui: {
    animationsEnabled: true,
    soundEnabled: false,
    notificationsEnabled: true,
  },
  chat: {
    maxMessageLength: 4000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    autoSave: true,
    streamingEnabled: true,
  },
  performance: {
    lazyLoading: true,
    imageOptimization: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },
};

export default config;

// Type-safe environment variables
export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
} as const;

// Validation
export function validateConfig(): boolean {
  const required = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
}

// Development helpers
export const isDev = config.app.environment === 'development';
export const isProd = config.app.environment === 'production';
export const isDebug = config.app.debug;

export { config };
