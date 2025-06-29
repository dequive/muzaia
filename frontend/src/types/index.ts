// Global types for Mozaia Frontend
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

// LLM and Chat Types
export type ContextType = 'general' | 'legal' | 'technical' | 'business' | 'academic';

export interface GenerationParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface LLMResponse {
  id: string;
  text: string;
  model: string;
  tokens_used?: number;
  processing_time?: number;
  cost?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ModelResponse {
  model_name: string;
  response_text: string;
  confidence: number;
  processing_time: number;
  tokens_used: number;
  cost: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface OrchestratorResponse {
  id: string;
  response: string;
  confidence: number;
  consensus_score: number;
  model_responses: ModelResponse[];
  processing_time: number;
  total_tokens: number;
  total_cost: number;
  requires_review: boolean;
  context_used: ContextType;
  metadata?: Record<string, any>;
  created_at: string;
}

// Chat Types
export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'image' | 'file';
  metadata?: {
    model_responses?: ModelResponse[];
    confidence?: number;
    consensus_score?: number;
    processing_time?: number;
    tokens_used?: number;
    cost?: number;
    context?: ContextType;
    requires_review?: boolean;
  };
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  context: ContextType;
  status: 'active' | 'completed' | 'archived';
  message_count: number;
  avg_confidence?: number;
  total_tokens?: number;
  total_cost?: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

// Streaming Types
export interface StreamChunk {
  content: string;
  is_final: boolean;
  model?: string;
  metadata?: Record<string, any>;
  error?: string;
  token_count?: number;
  processing_time?: number;
}

// API Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface GenerationRequest {
  query: string;
  context: ContextType;
  user_id: string;
  params?: GenerationParams;
  min_confidence?: number;
  enable_streaming?: boolean;
}

// Health and Metrics Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime?: number;
  components: Record<string, string>;
  models_available: string[];
  pool_summary: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  version: string;
  orchestrator_metrics: Record<string, any>;
  pool_metrics: Record<string, any>;
  factory_metrics: Record<string, any>;
  http_metrics: Record<string, any>;
}

export interface ModelInfo {
  name: string;
  provider: string;
  available: boolean;
  description?: string;
  capabilities?: string[];
  pricing?: {
    input_tokens?: number;
    output_tokens?: number;
    currency?: string;
  };
  limits?: {
    max_tokens?: number;
    context_length?: number;
    rate_limit?: number;
  };
  metadata?: Record<string, any>;
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  chat_settings_open: boolean;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  language: string;
}

export interface ChatSettings {
  model_preference?: string[];
  default_context: ContextType;
  generation_params: GenerationParams;
  auto_save: boolean;
  show_model_responses: boolean;
  show_confidence_scores: boolean;
  enable_streaming: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirm_password: string;
  name?: string;
  terms_accepted: boolean;
}

export interface ChatForm {
  message: string;
  context: ContextType;
  attachments?: File[];
}

export interface SettingsForm extends ChatSettings {
  name?: string;
  email?: string;
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  privacy: {
    analytics: boolean;
    data_collection: boolean;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  request_id?: string;
  retryable?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

// Store Types
export interface AppStore {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // UI
  ui: UIState;
  
  // Chat
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  
  // Settings
  chatSettings: ChatSettings;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  updateUI: (updates: Partial<UIState>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Constants
export const CONTEXT_TYPES: ContextType[] = [
  'general',
  'legal', 
  'technical',
  'business',
  'academic'
];

export const CONTEXT_LABELS: Record<ContextType, string> = {
  general: 'Geral',
  legal: 'Jurídico',
  technical: 'Técnico',
  business: 'Negócios',
  academic: 'Acadêmico'
};

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export const MESSAGE_TYPES = ['text', 'image', 'file'] as const;

export const CONVERSATION_STATUS = ['active', 'completed', 'archived'] as const;

export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;
