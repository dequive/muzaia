/* =============================================================================
   API-SPECIFIC TYPES
   ============================================================================= */

export interface ApiEndpoints {
  // Auth endpoints
  auth: {
    login: '/auth/login'
    register: '/auth/register'
    logout: '/auth/logout'
    refresh: '/auth/refresh'
    verify: '/auth/verify'
    reset: '/auth/reset-password'
    me: '/auth/me'
    sessions: '/auth/sessions'
  }
  
  // Chat endpoints
  chat: {
    conversations: '/api/v1/conversations'
    messages: '/api/v1/conversations/:id/messages'
    generate: '/api/v1/generate'
    stream: '/api/v1/stream'
    search: '/api/v1/search'
    export: '/api/v1/conversations/:id/export'
  }
  
  // User endpoints
  users: {
    profile: '/api/v1/users/profile'
    preferences: '/api/v1/users/preferences'
    usage: '/api/v1/users/usage'
    limits: '/api/v1/users/limits'
    billing: '/api/v1/users/billing'
  }
  
  // System endpoints
  system: {
    health: '/health'
    metrics: '/metrics'
    models: '/models'
    status: '/status'
  }
  
  // Upload endpoints
  upload: {
    file: '/api/v1/upload'
    image: '/api/v1/upload/image'
    bulk: '/api/v1/upload/bulk'
  }
  
  // Analytics endpoints
  analytics: {
    events: '/api/v1/analytics/events'
    metrics: '/api/v1/analytics/metrics'
    reports: '/api/v1/analytics/reports'
  }
}

export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verify: '/auth/verify',
    reset: '/auth/reset-password',
    me: '/auth/me',
    sessions: '/auth/sessions',
  },
  chat: {
    conversations: '/api/v1/conversations',
    messages: '/api/v1/conversations/:id/messages',
    generate: '/api/v1/generate',
    stream: '/api/v1/stream',
    search: '/api/v1/search',
    export: '/api/v1/conversations/:id/export',
  },
  users: {
    profile: '/api/v1/users/profile',
    preferences: '/api/v1/users/preferences',
    usage: '/api/v1/users/usage',
    limits: '/api/v1/users/limits',
    billing: '/api/v1/users/billing',
  },
  system: {
    health: '/health',
    metrics: '/metrics',
    models: '/models',
    status: '/status',
  },
  upload: {
    file: '/api/v1/upload',
    image: '/api/v1/upload/image',
    bulk: '/api/v1/upload/bulk',
  },
  analytics: {
    events: '/api/v1/analytics/events',
    metrics: '/api/v1/analytics/metrics',
    reports: '/api/v1/analytics/reports',
  },
} as const
