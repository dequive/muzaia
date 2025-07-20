
// =============================================================================
// CONSTANTS
// =============================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:8000'

export const CACHE_KEYS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  USER: 'user',
  MODELS: 'models',
  HEALTH: 'health',
} as const

export const ENDPOINTS = {
  HEALTH: '/health',
  CONVERSATIONS: '/api/v1/conversations',
  GENERATE: '/api/v1/generate',
  STREAM: '/api/v1/stream',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const
