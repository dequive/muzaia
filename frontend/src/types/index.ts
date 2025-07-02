/* =============================================================================
   MOZAIA FRONTEND - GLOBAL TYPES
   Enhanced type definitions with advanced features
   Last updated: 2025-07-02 01:55:00 UTC
   Author: @dequive
   ============================================================================= */

// =============================================================================
// BASE UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}
export type NonEmptyArray<T> = [T, ...T[]]
export type Prettify<T> = { [K in keyof T]: T[K] } & {}
export type Brand<T, B> = T & { __brand: B }

// Database-like IDs
export type ID = Brand<string, 'ID'>
export type UserID = Brand<string, 'UserID'>
export type ConversationID = Brand<string, 'ConversationID'>
export type MessageID = Brand<string, 'MessageID'>
export type SessionID = Brand<string, 'SessionID'>

// Timestamp types
export type ISODateString = Brand<string, 'ISODateString'>
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>

// =============================================================================
// SUPABASE & AUTHENTICATION TYPES
// =============================================================================

export type UserRole = 'admin' | 'user' | 'moderator' | 'premium' | 'enterprise'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'banned'
export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise'

// Supabase User Interface
export interface SupabaseUser {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmation_sent_at?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    name?: string
    avatar_url?: string
    [key: string]: any
  }
  identities?: {
    id: string
    user_id: string
    identity_data: {
      email?: string
      sub?: string
    }
    provider: string
    created_at: string
    updated_at: string
  }[]
  created_at: string
  updated_at: string
}

// Enhanced User Interface
export interface User extends Omit<SupabaseUser, 'id'> {
  id: UserID
  email: string
  name?: string
  displayName?: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  subscription: SubscriptionPlan
  preferences: UserPreferences
  limits: UserLimits
  usage: UserUsage
  created_at: ISODateString
  updated_at: ISODateString
  last_login_at?: ISODateString
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  metadata?: Record<string, unknown>
}

// Supabase Session Interface
export interface SupabaseSession {
  access_token: string
  token_type: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
  user: SupabaseUser
}

// Enhanced Session Interface
export interface Session {
  id: SessionID
  user: User
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: UnixTimestamp
  issued_at: UnixTimestamp
  provider_token?: string
  provider_refresh_token?: string
  device_info?: {
    userAgent: string
    ip: string
    country?: string
    city?: string
    device: string
    browser: string
    os: string
  }
  permissions: string[]
  scopes: string[]
}

// Auth Response Types
export interface SupabaseAuthResponse {
  data: {
    user: SupabaseUser | null
    session: SupabaseSession | null
  }
  error: Error | null
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User | null
    session: Session | null
  }
  error?: string
}

export interface SupabaseAuthError {
  message: string
  status?: number
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'TOKEN_EXPIRED' | 'PERMISSION_DENIED' | 'RATE_LIMITED' | 'UNKNOWN'
  message: string
  retryAfter?: number
  details?: Record<string, unknown>
}

export interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  initializing: boolean
  error: AuthError | null
  lastActivity: UnixTimestamp | null
}

export interface SupabaseAuthStateChange {
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'USER_DELETED'
  session: SupabaseSession | null
}

// Supabase Response Types
export interface SupabaseResponse<T> {
  data: T | null
  error: Error | null
  count?: number
  status?: number
  statusText?: string
}

// [O resto do seu arquivo index.ts permanece igual, incluindo:]
// - UserPreferences interface
// - UserLimits interface
// - UserUsage interface
// - Chat & Conversation Types
// - LLM & AI Types
// - API & Response Types
// - System & Monitoring Types
// - UI & State Types
// - Form Types
// - Analytics & Tracking Types
// - Store Types
// - Component Prop Types
// - Constants & Enums
// - Type Guards & Validators
// - Feature Flags
// - Webhook & Integration Types

// =============================================================================
// HELPER FUNCTIONS FOR SUPABASE
// =============================================================================

export const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null

  return {
    ...supabaseUser,
    id: supabaseUser.id as UserID,
    role: (supabaseUser.role as UserRole) || 'user',
    status: 'active' as UserStatus,
    subscription: 'free' as SubscriptionPlan,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    email_verified: !!supabaseUser.email_confirmed_at,
    phone_verified: false,
    two_factor_enabled: false,
    preferences: {} as UserPreferences, // Adicione valores padrão
    limits: {} as UserLimits, // Adicione valores padrão
    usage: {} as UserUsage, // Adicione valores padrão
    created_at: supabaseUser.created_at as ISODateString,
    updated_at: supabaseUser.updated_at as ISODateString,
    last_login_at: supabaseUser.last_sign_in_at as ISODateString | undefined,
  }
}

export const mapSupabaseSession = (
  supabaseSession: SupabaseSession | null
): Session | null => {
  if (!supabaseSession) return null

  return {
    id: generateSessionId(),
    user: mapSupabaseUser(supabaseSession.user)!,
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token || '',
    token_type: supabaseSession.token_type,
    expires_at: (supabaseSession.expires_at || 0) as UnixTimestamp,
    issued_at: Date.now() as UnixTimestamp,
    permissions: [],
    scopes: [],
  }
}

// Função helper para gerar SessionID
function generateSessionId(): SessionID {
  return `sess_${Math.random().toString(36).substr(2, 9)}` as SessionID
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  CONTEXT_TYPES,
  CONTEXT_LABELS,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  CONVERSATION_STATUS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  MODEL_PROVIDERS,
  mapSupabaseUser,
  mapSupabaseSession,
} as const
