/* =============================================================================
   MOZAIA FRONTEND - GLOBAL TYPES
   Enhanced type definitions with advanced features
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
// AUTHENTICATION & USER TYPES
// =============================================================================

export type UserRole = 'admin' | 'user' | 'moderator' | 'premium' | 'enterprise'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'banned'
export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise'

export interface UserPreferences {
  language: string
  timezone: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
  }
  privacy: {
    analytics: boolean
    dataCollection: boolean
    shareUsageData: boolean
    profileVisibility: 'public' | 'private' | 'friends'
  }
  accessibility: {
    highContrast: boolean
    reduceMotion: boolean
    fontSize: 'small' | 'medium' | 'large'
    screenReader: boolean
  }
}

export interface UserLimits {
  messagesPerDay: number
  tokensPerMonth: number
  conversationsMax: number
  fileUploadSizeMax: number
  apiCallsPerHour: number
}

export interface UserUsage {
  messagesUsed: number
  tokensUsed: number
  conversationsCount: number
  storageUsed: number
  apiCallsUsed: number
  resetDate: ISODateString
}

export interface User {
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

export interface Session {
  id: SessionID
  user: User
  access_token: string
  refresh_token?: string
  expires_at: UnixTimestamp
  issued_at: UnixTimestamp
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

export interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  lastActivity: UnixTimestamp | null
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'TOKEN_EXPIRED' | 'PERMISSION_DENIED' | 'RATE_LIMITED' | 'UNKNOWN'
  message: string
  retryAfter?: number
  details?: Record<string, unknown>
}

// =============================================================================
// CHAT & CONVERSATION TYPES
// =============================================================================

export type ContextType = 'general' | 'legal' | 'technical' | 'business' | 'academic' | 'creative' | 'educational' | 'research'
export type MessageRole = 'user' | 'assistant' | 'system' | 'function'
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'code' | 'embed'
export type ConversationStatus = 'active' | 'completed' | 'archived' | 'deleted' | 'shared'
export type ConversationVisibility = 'private' | 'shared' | 'public' | 'team'

export interface GenerationParams {
  temperature?: number
  max_tokens?: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
  seed?: number
  model?: string
  stream?: boolean
  safe_mode?: boolean
}

export interface MessageAttachment {
  id: ID
  type: MessageType
  name: string
  url: string
  size: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
  thumbnail?: string
  metadata?: Record<string, unknown>
}

export interface MessageReaction {
  emoji: string
  count: number
  users: UserID[]
  current_user_reacted: boolean
}

export interface MessageMetadata {
  model_responses?: ModelResponse[]
  confidence?: number
  consensus_score?: number
  processing_time?: number
  tokens_used?: number
  cost?: number
  context?: ContextType
  requires_review?: boolean
  edit_history?: Array<{
    content: string
    edited_at: ISODateString
    reason?: string
  }>
  reactions?: Record<string, MessageReaction>
  mentions?: UserID[]
  reply_to?: MessageID
  thread_id?: ID
  search_vector?: number[]
  sentiment?: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
  }
}

export interface Message {
  id: MessageID
  conversation_id: ConversationID
  user_id: UserID
  content: string
  role: MessageRole
  type: MessageType
  attachments?: MessageAttachment[]
  metadata?: MessageMetadata
  created_at: ISODateString
  updated_at?: ISODateString
  deleted_at?: ISODateString
  read_at?: ISODateString
  pinned: boolean
  flagged: boolean
  word_count: number
  character_count: number
}

export interface ConversationSummary {
  topic: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  complexity: 'low' | 'medium' | 'high'
  language: string
  tags: string[]
}

export interface ConversationSettings {
  model_preference?: string[]
  generation_params: GenerationParams
  auto_save: boolean
  auto_title: boolean
  context_awareness: boolean
  memory_enabled: boolean
  suggestions_enabled: boolean
  fact_checking: boolean
  content_filter: boolean
  custom_instructions?: string
}

export interface ConversationMetadata {
  summary?: ConversationSummary
  settings: ConversationSettings
  participants?: UserID[]
  shared_with?: Array<{
    user_id: UserID
    permission: 'read' | 'write' | 'admin'
    shared_at: ISODateString
  }>
  analytics?: {
    views: number
    likes: number
    shares: number
    avg_response_time: number
    user_satisfaction?: number
  }
  export_history?: Array<{
    format: 'pdf' | 'docx' | 'txt' | 'json'
    exported_at: ISODateString
    exported_by: UserID
  }>
}

export interface Conversation {
  id: ConversationID
  user_id: UserID
  title: string
  description?: string
  context: ContextType
  status: ConversationStatus
  visibility: ConversationVisibility
  message_count: number
  avg_confidence?: number
  total_tokens?: number
  total_cost?: number
  created_at: ISODateString
  updated_at: ISODateString
  last_message_at?: ISODateString
  archived_at?: ISODateString
  completed_at?: ISODateString
  pinned: boolean
  favorite: boolean
  metadata?: ConversationMetadata
  tags: string[]
  folder?: string
  color?: string
  estimated_reading_time?: number
}

// =============================================================================
// LLM & AI TYPES
// =============================================================================

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'huggingface' | 'ollama' | 'azure' | 'aws'
export type ModelCapability = 'text' | 'image' | 'code' | 'function_calling' | 'json_mode' | 'vision' | 'embedding'
export type ModelTier = 'free' | 'standard' | 'premium' | 'enterprise'

export interface ModelPricing {
  input_tokens: number
  output_tokens: number
  image_tokens?: number
  audio_seconds?: number
  currency: string
  billing_unit: 'per_token' | 'per_request' | 'per_minute'
}

export interface ModelLimits {
  max_tokens: number
  context_length: number
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  max_concurrent_requests: number
  max_file_size?: number
  supported_file_types?: string[]
}

export interface ModelInfo {
  id: string
  name: string
  display_name: string
  provider: ModelProvider
  version: string
  available: boolean
  tier: ModelTier
  description?: string
  capabilities: ModelCapability[]
  pricing?: ModelPricing
  limits: ModelLimits
  performance_metrics?: {
    latency_p50: number
    latency_p95: number
    accuracy_score?: number
    reliability_score: number
    uptime_percentage: number
  }
  metadata?: Record<string, unknown>
}

export interface ModelResponse {
  model_name: string
  response_text: string
  confidence: number
  processing_time: number
  tokens_used: number
  cost: number
  error?: string
  metadata?: {
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'function_call'
    usage_details?: Record<string, number>
    model_version?: string
    temperature_used?: number
    safety_ratings?: Array<{
      category: string
      probability: 'low' | 'medium' | 'high'
    }>
  }
}

export interface OrchestratorResponse {
  id: ID
  response: string
  confidence: number
  consensus_score: number
  model_responses: ModelResponse[]
  processing_time: number
  total_tokens: number
  total_cost: number
  requires_review: boolean
  context_used: ContextType
  metadata?: {
    voting_details?: Record<string, unknown>
    quality_score?: number
    fact_check_results?: Array<{
      claim: string
      verdict: 'true' | 'false' | 'uncertain'
      confidence: number
      sources?: string[]
    }>
    content_warnings?: string[]
  }
  created_at: ISODateString
}

export interface GenerationRequest {
  query: string
  context: ContextType
  user_id: UserID
  conversation_id?: ConversationID
  params?: GenerationParams
  min_confidence?: number
  enable_streaming?: boolean
  models?: string[]
  system_prompt?: string
  few_shot_examples?: Array<{
    input: string
    output: string
  }>
  tools?: Array<{
    name: string
    description: string
    parameters: Record<string, unknown>
  }>
}

export interface StreamChunk {
  id: ID
  content: string
  delta?: string
  is_final: boolean
  model?: string
  metadata?: {
    token_count?: number
    processing_time?: number
    confidence?: number
    timestamp: UnixTimestamp
  }
  error?: string
}

// =============================================================================
// API & RESPONSE TYPES
// =============================================================================

export interface ApiMeta {
  request_id: ID
  timestamp: ISODateString
  version: string
  rate_limit?: {
    limit: number
    remaining: number
    reset: UnixTimestamp
  }
  cache?: {
    hit: boolean
    ttl: number
    key?: string
  }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
  message?: string
  status: number
  meta: ApiMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string
  retryable: boolean
  retry_after?: number
  documentation_url?: string
  support_id?: string
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  next_cursor?: string
  prev_cursor?: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: PaginationMeta
  meta: ApiMeta
}

export interface SearchFilters {
  query?: string
  contexts?: ContextType[]
  date_from?: ISODateString
  date_to?: ISODateString
  user_ids?: UserID[]
  tags?: string[]
  has_attachments?: boolean
  min_confidence?: number
  statuses?: ConversationStatus[]
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface SearchRequest {
  filters?: SearchFilters
  sort?: SortOptions[]
  pagination?: {
    page?: number
    per_page?: number
    cursor?: string
  }
  include?: string[]
  fields?: string[]
}

// =============================================================================
// SYSTEM & MONITORING TYPES
// =============================================================================

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'maintenance'
export type ComponentStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage'

export interface HealthCheck {
  name: string
  status: ComponentStatus
  response_time?: number
  last_checked: ISODateString
  details?: Record<string, unknown>
}

export interface SystemHealth {
  status: HealthStatus
  timestamp: ISODateString
  version: string
  uptime: number
  components: HealthCheck[]
  models_available: string[]
  pool_summary: Record<string, unknown>
  performance: {
    avg_response_time: number
    requests_per_second: number
    error_rate: number
    cpu_usage: number
    memory_usage: number
    disk_usage: number
  }
}

export interface SystemMetrics {
  timestamp: ISODateString
  uptime: number
  version: string
  orchestrator_metrics: {
    requests_processed: number
    avg_processing_time: number
    success_rate: number
    error_count: number
  }
  pool_metrics: Record<string, {
    active_connections: number
    idle_connections: number
    total_requests: number
    avg_response_time: number
  }>
  factory_metrics: {
    models_loaded: number
    memory_usage: number
    cpu_usage: number
  }
  http_metrics: {
    total_requests: number
    avg_response_time: number
    status_codes: Record<string, number>
    active_connections: number
  }
}

export interface PerformanceMetrics {
  renderTime: number
  apiLatency: number
  memoryUsage: number
  cacheHitRate: number
  errorRate: number
  lastMeasurement: UnixTimestamp
  bundleSize?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
}

// =============================================================================
// UI & STATE TYPES
// =============================================================================

export type Theme = 'light' | 'dark' | 'system' | 'purple' | 'green' | 'orange' | 'red'
export type Language = 'pt-MZ' | 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE'
export type Density = 'compact' | 'comfortable' | 'spacious'

export interface UIState {
  theme: Theme
  language: Language
  density: Density
  sidebar_collapsed: boolean
  chat_settings_open: boolean
  notifications_panel_open: boolean
  command_palette_open: boolean
  notifications_enabled: boolean
  sound_enabled: boolean
  animations_enabled: boolean
  high_contrast: boolean
  reduce_motion: boolean
  font_size: 'small' | 'medium' | 'large'
  sidebar_width: number
  chat_width: number
  zoom_level: number
}

export interface ChatSettings {
  model_preference: string[]
  default_context: ContextType
  generation_params: GenerationParams
  auto_save: boolean
  auto_save_interval: number
  show_model_responses: boolean
  show_confidence_scores: boolean
  show_token_count: boolean
  show_cost: boolean
  enable_streaming: boolean
  auto_title: boolean
  save_history: boolean
  max_context_length: number
  typing_indicator: boolean
  read_receipts: boolean
  message_grouping: boolean
  timestamp_format: 'relative' | 'absolute'
  code_syntax_highlighting: boolean
  math_rendering: boolean
  link_previews: boolean
}

export type LoadingState = {
  [K in 'app' | 'auth' | 'conversations' | 'messages' | 'upload' | 'generation' | 'sync']: boolean
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

export interface NotificationState {
  id: ID
  type: NotificationType
  title?: string
  message: string
  duration?: number
  position?: NotificationPosition
  dismissible: boolean
  timestamp: UnixTimestamp
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary'
  }>
  metadata?: Record<string, unknown>
}

export interface ErrorState {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: UnixTimestamp
  stack?: string
  component?: string
  user_action?: string
  recovery_suggestions?: string[]
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface LoginForm {
  email: string
  password: string
  remember_me: boolean
  captcha_token?: string
}

export interface RegisterForm {
  email: string
  password: string
  confirm_password: string
  name: string
  terms_accepted: boolean
  marketing_consent: boolean
  captcha_token?: string
  referral_code?: string
}

export interface ChatForm {
  message: string
  context: ContextType
  attachments: File[]
  reply_to?: MessageID
  scheduled_for?: ISODateString
}

export interface SettingsForm {
  personal: {
    name: string
    email: string
    avatar: File | string | null
    timezone: string
    language: Language
  }
  chat: ChatSettings
  ui: Partial<UIState>
  notifications: UserPreferences['notifications']
  privacy: UserPreferences['privacy']
  accessibility: UserPreferences['accessibility']
  billing?: {
    plan: SubscriptionPlan
    auto_renew: boolean
    billing_email?: string
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

export interface FormState<T = Record<string, unknown>> {
  values: T
  errors: ValidationError[]
  touched: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// =============================================================================
// ANALYTICS & TRACKING TYPES
// =============================================================================

export type EventCategory = 'user' | 'chat' | 'ui' | 'system' | 'error' | 'performance'
export type EventAction = string
export type EventLabel = string

export interface AnalyticsEvent {
  category: EventCategory
  action: EventAction
  label?: EventLabel
  value?: number
  properties?: Record<string, unknown>
  user_id?: UserID
  session_id?: SessionID
  timestamp: UnixTimestamp
  page_url?: string
  user_agent?: string
  referrer?: string
}

export interface AnalyticsMetrics {
  page_views: number
  unique_users: number
  session_duration: number
  bounce_rate: number
  conversion_rate: number
  retention_rate: number
  churn_rate: number
  feature_adoption: Record<string, number>
  error_rate: number
  performance_score: number
}

// =============================================================================
// STORE TYPES
// =============================================================================

export interface AppStore {
  // Auth state
  auth: AuthState
  
  // UI state
  ui: UIState
  
  // Chat state
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  drafts: Record<ConversationID, string>
  
  // System state
  loading: LoadingState
  error: ErrorState | null
  notifications: NotificationState[]
  
  // Settings
  chatSettings: ChatSettings
  
  // Cache & sync
  cache: Record<string, { data: unknown; timestamp: UnixTimestamp }>
  lastSync: UnixTimestamp | null
  pendingActions: Array<{
    id: ID
    type: string
    payload: unknown
    timestamp: UnixTimestamp
  }>
  
  // Performance
  performance: PerformanceMetrics
  
  // Actions (simplified - full implementation would have proper typing)
  [key: string]: unknown
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  testId?: string
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'ghost' | 'outline' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  form?: string
  autoFocus?: boolean
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  error?: string | ValidationError
  success?: boolean
  loading?: boolean
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// =============================================================================
// CONSTANTS & ENUMS
// =============================================================================

export const CONTEXT_TYPES: readonly ContextType[] = [
  'general',
  'legal',
  'technical',
  'business',
  'academic',
  'creative',
  'educational',
  'research'
] as const

export const CONTEXT_LABELS: Record<ContextType, string> = {
  general: 'Geral',
  legal: 'Jurídico',
  technical: 'Técnico',
  business: 'Negócios',
  academic: 'Acadêmico',
  creative: 'Criativo',
  educational: 'Educacional',
  research: 'Pesquisa'
} as const

export const MESSAGE_ROLES: readonly MessageRole[] = [
  'user',
  'assistant', 
  'system',
  'function'
] as const

export const MESSAGE_TYPES: readonly MessageType[] = [
  'text',
  'image',
  'file',
  'audio',
  'video',
  'code',
  'embed'
] as const

export const CONVERSATION_STATUS: readonly ConversationStatus[] = [
  'active',
  'completed',
  'archived',
  'deleted',
  'shared'
] as const

export const THEME_OPTIONS: readonly Theme[] = [
  'light',
  'dark',
  'system',
  'purple',
  'green',
  'orange',
  'red'
] as const

export const LANGUAGE_OPTIONS: readonly Language[] = [
  'pt-MZ',
  'pt-BR',
  'en-US',
  'es-ES',
  'fr-FR',
  'de-DE'
] as const

export const USER_ROLES: readonly UserRole[] = [
  'admin',
  'user',
  'moderator',
  'premium',
  'enterprise'
] as const

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  'free',
  'pro',
  'business',
  'enterprise'
] as const

export const MODEL_PROVIDERS: readonly ModelProvider[] = [
  'openai',
  'anthropic',
  'google',
  'huggingface',
  'ollama',
  'azure',
  'aws'
] as const

// =============================================================================
// TYPE GUARDS & VALIDATORS
// =============================================================================

export const isContextType = (value: string): value is ContextType => {
  return CONTEXT_TYPES.includes(value as ContextType)
}

export const isMessageRole = (value: string): value is MessageRole => {
  return MESSAGE_ROLES.includes(value as MessageRole)
}

export const isTheme = (value: string): value is Theme => {
  return THEME_OPTIONS.includes(value as Theme)
}

export const isUserRole = (value: string): value is UserRole => {
  return USER_ROLES.includes(value as UserRole)
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidID = (id: string): id is ID => {
  return typeof id === 'string' && id.length > 0
}

export const isISODateString = (date: string): date is ISODateString => {
  return !isNaN(Date.parse(date))
}

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export interface FeatureFlags {
  enableVoiceInput: boolean
  enableImageGeneration: boolean
  enableCollaboration: boolean
  enableAdvancedAnalytics: boolean
  enableCustomModels: boolean
  enableAPIAccess: boolean
  enableWhiteLabeling: boolean
  enableSSO: boolean
  enableAuditLogs: boolean
  enableDataExport: boolean
  enableCustomBranding: boolean
  enablePrioritySupport: boolean
  [key: string]: boolean
}

// =============================================================================
// WEBHOOK & INTEGRATION TYPES
// =============================================================================

export type WebhookEvent = 
  | 'message.created'
  | 'message.updated'
  | 'conversation.created'
  | 'conversation.completed'
  | 'user.registered'
  | 'user.subscription.changed'

export interface WebhookPayload<T = unknown> {
  event: WebhookEvent
  data: T
  timestamp: ISODateString
  user_id?: UserID
  organization_id?: ID
}

export interface Integration {
  id: ID
  name: string
  type: 'webhook' | 'api' | 'oauth'
  enabled: boolean
  config: Record<string, unknown>
  created_at: ISODateString
  last_used?: ISODateString
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type * from './api'
export type * from './components'
export type * from './forms'
export type * from './store'

// Default export for convenience
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
} as const
