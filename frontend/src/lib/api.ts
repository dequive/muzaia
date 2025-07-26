import axios, { 
  AxiosInstance, 
  AxiosResponse, 
  AxiosError, 
  AxiosRequestConfig,
  CreateAxiosDefaults
} from 'axios'
import { toast } from 'react-hot-toast'
import { config, isDev, isProd, isDebug } from './config'
import { retry, withTimeout, generateId, debounce } from './utils'
import type {
  ApiResponse,
  GenerationRequest,
  OrchestratorResponse,
  Conversation,
  Message,
  HealthStatus,
  SystemMetrics,
  ModelInfo,
  User,
} from '@/types'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RequestMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  error?: string
}

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
  lastModified?: string
}

interface RequestQueue {
  id: string
  config: AxiosRequestConfig
  resolve: (value: any) => void
  reject: (reason: any) => void
  retryCount: number
  timestamp: number
}

interface ApiClientOptions extends CreateAxiosDefaults {
  enableCache?: boolean
  enableRetry?: boolean
  enableQueue?: boolean
  enableMetrics?: boolean
  enableMocks?: boolean
  cacheProvider?: 'memory' | 'localStorage' | 'indexedDB'
  retryOptions?: {
    attempts: number
    delay: number
    exponential: boolean
  }
}

// =============================================================================
// CACHE MANAGER
// =============================================================================

class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private provider: 'memory' | 'localStorage' | 'indexedDB'
  private maxSize: number
  private defaultTTL: number

  constructor(
    provider: 'memory' | 'localStorage' | 'indexedDB' = 'memory',
    maxSize: number = 100,
    defaultTTL: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.provider = provider
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL

    // Clean expired entries periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }

  /**
   * Gera chave de cache baseada na configuração da request
   */
  private generateKey(config: AxiosRequestConfig): string {
    const { method = 'GET', url = '', params, data } = config
    const key = `${method.toUpperCase()}:${url}`

    if (params) {
      const searchParams = new URLSearchParams(params).toString()
      return `${key}?${searchParams}`
    }

    if (data && method.toUpperCase() !== 'GET') {
      const hash = this.hashObject(data)
      return `${key}:${hash}`
    }

    return key
  }

  /**
   * Gera hash simples de objeto
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Verifica se entrada de cache é válida
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
      }
    }

    // Remove entradas mais antigas se exceder o tamanho máximo
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = entries.slice(0, entries.length - this.maxSize)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Obtém item do cache
   */
  get<T>(config: AxiosRequestConfig): T | null {
    const key = this.generateKey(config)
    const entry = this.cache.get(key)

    if (!entry || !this.isValid(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Define item no cache
   */
  set<T>(config: AxiosRequestConfig, data: T, ttl?: number): void {
    const key = this.generateKey(config)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)
  }

  /**
   * Remove item do cache
   */
  delete(config: AxiosRequestConfig): void {
    const key = this.generateKey(config)
    this.cache.delete(key)
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // TODO: Implementar tracking de hit rate
    }
  }
}

// =============================================================================
// METRICS MANAGER
// =============================================================================

class MetricsManager {
  private metrics: RequestMetrics[] = []
  private maxMetrics = 1000

  /**
   * Inicia tracking de request
   */
  startRequest(config: AxiosRequestConfig): string {
    const requestId = generateId()
    const metric: RequestMetrics = {
      requestId,
      method: config.method?.toUpperCase() || 'GET',
      url: config.url || '',
      startTime: Date.now()
    }

    this.metrics.push(metric)

    // Remove métricas antigas se exceder o limite
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    return requestId
  }

  /**
   * Finaliza tracking de request
   */
  endRequest(requestId: string, response?: AxiosResponse, error?: AxiosError): void {
    const metric = this.metrics.find(m => m.requestId === requestId)
    if (!metric) return

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime
    metric.status = response?.status || error?.response?.status
    metric.error = error?.message
  }

  /**
   * Obtém estatísticas das métricas
   */
  getStats(): {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    requestsPerSecond: number
  } {
    const completedMetrics = this.metrics.filter(m => m.endTime)
    const errorMetrics = this.metrics.filter(m => m.error || (m.status && m.status >= 400))

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const averageResponseTime = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0

    const now = Date.now()
    const lastMinute = now - 60000
    const recentRequests = this.metrics.filter(m => m.startTime > lastMinute)

    return {
      totalRequests: this.metrics.length,
      averageResponseTime,
      errorRate: this.metrics.length > 0 ? errorMetrics.length / this.metrics.length : 0,
      requestsPerSecond: recentRequests.length / 60
    }
  }

  /**
   * Obtém métricas recentes
   */
  getRecentMetrics(limit = 50): RequestMetrics[] {
    return this.metrics.slice(-limit)
  }
}

// =============================================================================
// QUEUE MANAGER
// =============================================================================

class QueueManager {
  private queue: RequestQueue[] = []
  private processing = false
  private maxQueueSize = 100

  /**
   * Adiciona request à queue
   */
  enqueue(config: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Queue is full'))
        return
      }

      const queueItem: RequestQueue = {
        id: generateId(),
        config,
        resolve,
        reject,
        retryCount: 0,
        timestamp: Date.now()
      }

      this.queue.push(queueItem)
      this.processQueue()
    })
  }

  /**
   * Processa queue de requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()!

      try {
        // Check if request is too old
        if (Date.now() - item.timestamp > 5 * 60 * 1000) { // 5 minutes
          item.reject(new Error('Request timeout in queue'))
          continue
        }

        const response = await axios(item.config)
        item.resolve(response)
      } catch (error) {
        item.reject(error)
      }
    }

    this.processing = false
  }

  /**
   * Obtém estatísticas da queue
   */
  getStats(): { size: number; maxSize: number; processing: boolean } {
    return {
      size: this.queue.length,
      maxSize: this.maxQueueSize,
      processing: this.processing
    }
  }

  /**
   * Limpa queue
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'))
    })
    this.queue = []
  }
}

// =============================================================================
// ENHANCED API CLIENT
// =============================================================================

class EnhancedApiClient {
  private client: AxiosInstance
  private cache: CacheManager
  private metrics: MetricsManager
  private queue: QueueManager
  private options: Required<ApiClientOptions>
  private rateLimiter = new Map<string, number>()

  constructor(options: ApiClientOptions = {}) {
    this.options = {
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      enableCache: true,
      enableRetry: true,
      enableQueue: true,
      enableMetrics: isDev || config.monitoring.enabled,
      enableMocks: false,
      cacheProvider: 'memory',
      retryOptions: {
        attempts: config.api.retries,
        delay: 1000,
        exponential: true
      },
      ...options
    }

    this.cache = new CacheManager(this.options.cacheProvider)
    this.metrics = new MetricsManager()
    this.queue = new QueueManager()

    this.client = this.createClient()
  }

  /**
   * Cria instância do cliente Axios
   */
  private createClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': config.app.version,
        'X-Environment': config.app.environment,
        'X-User-Agent': `Mozaia/${config.app.version} (${typeof window !== 'undefined' ? navigator.userAgent : 'Server'})`,
      },
    })

    this.setupInterceptors(client)
    return client
  }

  /**
   * Configura interceptors
   */
  private setupInterceptors(client: AxiosInstance): void {
    // Request interceptor
    client.interceptors.request.use(
      async (config) => {
        // Add request ID for tracking
        const requestId = generateId()
        config.headers['X-Request-ID'] = requestId

        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Check rate limiting
        if (this.isRateLimited(config)) {
          throw new Error('Rate limit exceeded')
        }

        // Check cache for GET requests
        if (config.method?.toLowerCase() === 'get' && this.options.enableCache) {
          const cached = this.cache.get(config)
          if (cached) {
            // Return cached response
            return Promise.reject({
              config,
              response: { data: cached },
              cached: true
            })
          }
        }

        // Start metrics tracking
        if (this.options.enableMetrics) {
          config.metadata = { requestId }
          this.metrics.startRequest(config)
        }

        // Log requests in development
        if (isDebug) {
          console.log('🚀 API Request:', {
            id: requestId,
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            headers: config.headers
          })
        }

        return config
      },
      (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.headers['X-Request-ID']

        // End metrics tracking
        if (this.options.enableMetrics && response.config.metadata?.requestId) {
          this.metrics.endRequest(response.config.metadata.requestId, response)
        }

        // Cache successful GET responses
        if (
          response.config.method?.toLowerCase() === 'get' && 
          this.options.enableCache &&
          response.status === 200
        ) {
          this.cache.set(response.config, response.data)
        }

        // Log responses in development
        if (isDebug) {
          console.log('✅ API Response:', {
            id: requestId,
            status: response.status,
            url: response.config.url,
            data: response.data,
            duration: response.config.metadata?.duration
          })
        }

        return response
      },
      async (error: AxiosError) => {
        // Handle cached responses
        if (error.cached) {
          return Promise.resolve(error.response)
        }

        const requestId = error.config?.headers?.['X-Request-ID']

        // End metrics tracking
        if (this.options.enableMetrics && error.config?.metadata?.requestId) {
          this.metrics.endRequest(error.config.metadata.requestId, undefined, error)
        }

        // Extract meaningful error information
        const errorInfo = {
          id: requestId,
          code: error?.code || 'UNKNOWN',
          status: error?.response?.status || 0,
          url: error?.config?.url || 'unknown',
          method: error?.config?.method?.toUpperCase() || 'UNKNOWN',
          message: this.extractErrorMessage(error),
          data: error?.response?.data || null,
          isNetworkError: !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')
        }

        // Create a safe logging object that won't serialize to empty
        const safeLogData = {
          timestamp: new Date().toISOString(),
          requestId: errorInfo.id,
          method: errorInfo.method,
          url: errorInfo.url,
          baseURL: this.client.defaults.baseURL || 'undefined',
          fullUrl: `${this.client.defaults.baseURL}${errorInfo.url}`,
          status: errorInfo.status || 'No Response',
          code: errorInfo.code,
          message: errorInfo.message,
          isNetworkError: errorInfo.isNetworkError,
          timeout: error?.config?.timeout || 'undefined',
          hasResponse: !!error.response,
          hasConfig: !!error.config
        }

        // Add response data if available
        if (errorInfo.data) {
          safeLogData.responseData = typeof errorInfo.data === 'object' ? 
            JSON.stringify(errorInfo.data) : 
            String(errorInfo.data)
        }

        // Always log API errors with safe formatting
        console.error('❌ API Error Details:', safeLogData)

        // Additional specific error analysis
        if (errorInfo.isNetworkError) {
          console.error('🔍 Network Error Analysis:', {
            issue: 'Network connection failed',
            possibleCauses: [
              'Backend não está executando na porta 8000',
              'URL da API incorreta: ' + safeLogData.fullUrl,
              'Problemas de CORS',
              'Firewall bloqueando requisição',
              'Timeout da rede'
            ],
            suggestedActions: [
              'Executar: curl http://0.0.0.0:8000/health',
              'Verificar se backend workflow está rodando',
              'Confirmar variáveis de ambiente'
            ],
            currentConfig: {
              baseURL: safeLogData.baseURL,
              timeout: safeLogData.timeout
            }
          })
        }

        // Also log the full error for debugging in development
        if (isDebug) {
          try {
            // Safe error object logging
            const safeErrorLog = {
              errorName: error?.name || 'Unknown',
              errorMessage: error?.message || 'No message',
              errorCode: error?.code || 'No code',
              errorStack: error?.stack ? 'Present' : 'None',
              hasStack: !!error?.stack,
              hasConfig: !!error?.config,
              hasResponse: !!error?.response,
              configUrl: error?.config?.url || 'undefined',
              configMethod: error?.config?.method || 'undefined',
              responseStatus: error?.response?.status || 'undefined',
              responseStatusText: error?.response?.statusText || 'undefined'
            }

            console.error('Full error analysis:', safeErrorLog)

            // Only log the actual error in debug if it exists
            if (error) {
              console.error('Raw error:', error)
            }
          } catch (logError) {
            console.error('Error logging failed:', logError)
          }
        }

        // Handle specific error cases
        await this.handleError(error)

        // Retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Obtém token de autenticação
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('mozaia_token')
  }

  /**
   * Extrai mensagem de erro da resposta da API
   */
  private extractErrorMessage(error: AxiosError): string {
    // Handle specific network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Falha na conexão com o servidor. Verifique se o backend está executando na porta 8000.'
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Conexão recusada. O servidor backend não está acessível.'
    }

    if (error.code === 'ECONNABORTED') {
      return 'Timeout da requisição. O servidor demorou muito para responder.'
    }

    // Try different sources for error message from response
    if (error.response?.data) {
      const data = error.response.data as any

      // Try common error message fields
      const message = data.message || 
                     data.error || 
                     data.detail || 
                     data.msg ||
                     (typeof data === 'string' ? data : null)

      if (message && typeof message === 'string') {
        return message
      }

      // If data is an object but no standard message field
      if (typeof data === 'object' && Object.keys(data).length > 0) {
        return `Erro da API (${error.response.status}): ${JSON.stringify(data)}`
      }
    }

    // Add status code to message if available
    const statusText = error.response?.status ? ` (Status: ${error.response.status})` : ''
    const baseMessage = error.message || 'Erro de conexão com a API'

    return `${baseMessage}${statusText}`
  }

  /**
   * Verifica rate limiting
   */
  private isRateLimited(config: AxiosRequestConfig): boolean {
    if (!config.url) return false

    const key = `${config.method}:${config.url}`
    const now = Date.now()
    const lastRequest = this.rateLimiter.get(key) || 0

    // Minimum 100ms between same requests
    if (now - lastRequest < 100) {
      return true
    }

    this.rateLimiter.set(key, now)
    return false
  }

  /**
   * Trata erros específicos
   */
  private async handleError(error: AxiosError): Promise<void> {
    const { response, code } = error

    switch (response?.status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('mozaia_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        break

      case 403:
        toast.error('Acesso negado. Você não tem permissão para esta ação.')
        break

      case 404:
        toast.error('Recurso não encontrado.')
        break

      case 429:
        toast.error('Muitas requisições. Tente novamente em alguns segundos.')
        break

      case 500:
        toast.error('Erro interno do servidor. Nossa equipe foi notificada.')
        break

      case 502:
      case 503:
      case 504:
        toast.error('Serviço temporariamente indisponível. Tente novamente.')
        break

      default:
        if (code === 'ECONNABORTED') {
          toast.error('Tempo limite da requisição excedido.')
        } else if (code === 'ERR_NETWORK') {
          toast.error('Erro de conexão. Verifique sua internet.')
        } else if (response?.data?.message) {
          toast.error(response.data.message)
        }
    }
  }

  /**
   * Verifica se deve fazer retry
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!this.options.enableRetry) return false
    if (!error.config) return false

    const retryCount = (error.config as any).__retryCount || 0
    if (retryCount >= this.options.retryOptions.attempts) return false

    // Retry on network errors, timeouts, or 5xx status codes
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error'
    )

    const isServerError = error.response && 
      error.response.status >= 500 && 
      error.response.status < 600

    const isTimeout = error.code === 'ECONNABORTED'

    return isNetworkError || isServerError || isTimeout
  }

  /**
   * Faz retry da request
   */
  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!
    const retryCount = ((config as any).__retryCount || 0) + 1

    // Add retry count to config
    ;(config as any).__retryCount = retryCount

    // Calculate delay
    let delay = this.options.retryOptions.delay
    if (this.options.retryOptions.exponential) {
      delay = delay * Math.pow(2, retryCount - 1)
    }

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay))

    if (isDebug) {
      console.log(`🔄 Retrying request (${retryCount}/${this.options.retryOptions.attempts}):`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        delay
      })
    }

    return this.client(config)
  }

  /**
   * Executa request com todas as funcionalidades
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      // Check if online
      if (!navigator.onLine && this.options.enableQueue) {
        return this.queue.enqueue(config)
      }

      const response = await this.client(config)
      return this.handleResponse<T>(response)
    } catch (error) {
      if (!navigator.onLine && this.options.enableQueue) {
        return this.queue.enqueue(config)
      }
      throw error
    }
  }

  /**
   * Trata resposta da API
   */
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data.error) {
      throw new Error(response.data.error)
    }
    return response.data.data!
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  /**
   * Streaming request
   */
  async *stream<T = any>(url: string, data?: any): AsyncGenerator<T, void, unknown> {
    const response = await this.client.post(url, data, {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })

    const reader = response.data.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data

              if (data.is_final) {
                return
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Upload com progress
   */
  async upload<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress(progress)
        }
      },
    })
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear()
  }

  getMetrics() {
    return this.metrics.getStats()
  }

  getCacheStats() {
    return this.cache.getStats()
  }

  getQueueStats() {
    return this.queue.getStats()
  }
}

// =============================================================================
// CREATE API CLIENT INSTANCE
// =============================================================================

const api = new EnhancedApiClient({
  enableCache: config.cache.enabled,
  enableRetry: true,
  enableQueue: true,
  enableMetrics: config.monitoring.enabled,
  cacheProvider: config.cache.strategies.api as any,
})

// =============================================================================
// API MODULES
// =============================================================================

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', { 
      email, 
      password 
    })

    // Store token
    if (response.token) {
      localStorage.setItem('mozaia_token', response.token)
    }

    return response
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/register', { 
      email, 
      password, 
      name 
    })

    // Store token
    if (response.token) {
      localStorage.setItem('mozaia_token', response.token)
    }

    return response
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('mozaia_token')
      api.clearCache() // Clear cache on logout
    }
  },

  refreshToken: async () => {
    const response = await api.post<{ token: string }>('/auth/refresh')

    if (response.token) {
      localStorage.setItem('mozaia_token', response.token)
    }

    return response
  },

  getCurrentUser: async () => {
    return api.get<User>('/auth/me')
  },

  updateProfile: async (updates: Partial<User>) => {
    return api.patch<User>('/auth/profile', updates)
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
  },

  forgotPassword: async (email: string) => {
    return api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, newPassword: string) => {
    return api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    })
  },
}

// Chat API
export const chatApi = {
  generate: async (request: GenerationRequest): Promise<OrchestratorResponse> => {
    return api.post<OrchestratorResponse>('/api/v1/generate', request)
  },

  streamGenerate: async function* (request: Omit<GenerationRequest, 'enable_streaming'>) {
    yield* api.stream<any>('/api/v1/stream', {
      ...request,
      enable_streaming: true
    })
  },

  getConversations: async (params?: {
    limit?: number
    offset?: number
    search?: string
    sort?: 'created_at' | 'updated_at' | 'title'
    order?: 'asc' | 'desc'
  }): Promise<{ conversations: Conversation[]; total: number }> => {
    return api.get<{ conversations: Conversation[]; total: number }>('/api/v1/conversations', {
      params
    })
  },

  getConversation: async (id: string): Promise<Conversation> => {
    return api.get<Conversation>(`/api/v1/conversations/${id}`)
  },

  createConversation: async (data: {
    title: string
    context?: string
    model?: string
    temperature?: number
  }): Promise<Conversation> => {
    return api.post<Conversation>('/api/v1/conversations', data)
  },

  updateConversation: async (id: string, updates: Partial<Conversation>): Promise<Conversation> => {
    return api.patch<Conversation>(`/api/v1/conversations/${id}`, updates)
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/conversations/${id}`)
  },

  duplicateConversation: async (id: string): Promise<Conversation> => {
    return api.post<Conversation>(`/api/v1/conversations/${id}/duplicate`)
  },

  shareConversation: async (id: string, options?: {
    public?: boolean
    password?: string
    expiresAt?: string
  }): Promise<{ shareUrl: string; shareId: string }> => {
    return api.post(`/api/v1/conversations/${id}/share`, options)
  },

  getMessages: async (
    conversationId: string,
    params?: {
      limit?: number
      offset?: number
      before?: string
      after?: string
    }
  ): Promise<{ messages: Message[]; total: number }> => {
    return api.get<{ messages: Message[]; total: number }>(
      `/api/v1/conversations/${conversationId}/messages`,
      { params }
    )
  },

  createMessage: async (
    conversationId: string,
    data: {
      content: string
      role?: 'user' | 'assistant'
      attachments?: Array<{
        type: string
        url: string
        name: string
      }>
    }
  ): Promise<Message> => {
    return api.post<Message>(`/api/v1/conversations/${conversationId}/messages`, data)
  },

  updateMessage: async (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ): Promise<Message> => {
    return api.patch<Message>(
      `/api/v1/conversations/${conversationId}/messages/${messageId}`,
      updates
    )
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`)
  },

  regenerateMessage: async (conversationId: string, messageId: string): Promise<Message> => {
    return api.post<Message>(
      `/api/v1/conversations/${conversationId}/messages/${messageId}/regenerate`
    )
  },

  likeMessage: async (conversationId: string, messageId: string, liked: boolean): Promise<void> => {
    await api.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/like`, {
      liked
    })
  },
}

// System API
export const systemApi = {
  getHealth: async (): Promise<HealthStatus> => {
    return api.get<HealthStatus>('/health')
  },

  getMetrics: async (): Promise<SystemMetrics> => {
    return api.get<SystemMetrics>('/metrics')
  },

  getModels: async (): Promise<ModelInfo[]> => {
    return api.get<ModelInfo[]>('/models')
  },

  getModelInfo: async (modelName: string): Promise<ModelInfo> => {
    return api.get<ModelInfo>(`/models/${modelName}`)
  },

  clearCache: async (): Promise<void> => {
    await api.post('/admin/cache/clear')
    api.clearCache() // Also clear client cache
  },

  preloadModel: async (
    modelName: string, 
    count: number = 2
  ): Promise<{ created: number }> => {
    return api.post<{ created: number }>(`/admin/pool/${modelName}/preload`, { count })
  },

  getSystemStats: async (): Promise<{
    uptime: number
    memory: { used: number; total: number }
    cpu: { usage: number; cores: number }
    requests: { total: number; rate: number }
  }> => {
    return api.get('/admin/stats')
  },

  exportData: async (format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    return api.get(`/admin/export?format=${format}`, {
      responseType: 'blob'
    })
  },
}

// Upload API
export const uploadApi = {
  uploadFile: async (
    file: File,
    options?: {
      onProgress?: (progress: number) => void
      folder?: string
      public?: boolean
    }
  ): Promise<{ url: string; filename: string; size: number; type: string }> => {
    return api.upload('/api/v1/upload', file, options?.onProgress)
  },

  uploadMultiple: async (
    files: File[],
    options?: {
      onProgress?: (progress: number) => void
      folder?: string
      public?: boolean
    }
  ): Promise<Array<{ url: string; filename: string; size: number; type: string }>> => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    if (options?.folder) {
      formData.append('folder', options.folder)
    }

    if (options?.public !== undefined) {
      formData.append('public', String(options.public))
    }

    return api.post('/api/v1/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          options.onProgress(progress)
        }
      },
    })
  },

  deleteFile: async (filename: string): Promise<void> => {
    await api.delete(`/api/v1/upload/${filename}`)
  },

  getFileInfo: async (filename: string): Promise<{
    url: string
    filename: string
    size: number
    type: string
    uploadedAt: string
  }> => {
    return api.get(`/api/v1/upload/${filename}/info`)
  },
}

// Glossario API
export const glossarioApi = {
  getTermos: async (params?: {
    page?: number
    limit?: number
    query?: string
    categoria?: string
    status?: string
    nivel_tecnico?: string
  }): Promise<{
    items: any[]
    total: number
    pages: number
    current_page: number
  }> => {
    return api.get('/api/glossario/', { params })
  },

  getTermo: async (id: string): Promise<any> => {
    return api.get(`/api/glossario/${id}`)
  },

  createTermo: async (data: {
    termo: string
    definicao: string
    categoria: string
    nivel_tecnico: string
    exemplo?: string
    sinonimos: string[]
    jurisdicao: string
    idioma: string
    tags: string[]
  }): Promise<any> => {
    return api.post('/api/glossario/', data)
  },

  updateTermo: async (id: string, data: Partial<any>): Promise<any> => {
    return api.put(`/api/glossario/${id}`, data)
  },

  deleteTermo: async (id: string): Promise<void> => {
    await api.delete(`/api/glossario/${id}`)
  },

  getStats: async (): Promise<{
    total_termos: number
    por_categoria: Record<string, number>
    por_nivel: Record<string, number>
    por_status: Record<string, number>
    por_jurisdicao: Record<string, number>
  }> => {
    return api.get('/api/glossario/stats/overview')
  },

  searchTermos: async (query: string, limit?: number): Promise<any[]> => {
    return api.get('/api/glossario/search', { 
      params: { query, limit: limit || 10 }
    })
  },
}

// Analytics API
export const analyticsApi = {
  trackEvent: debounce(async (event: {
    name: string
    properties?: Record<string, any>
    userId?: string
    sessionId?: string
  }) => {
    if (!config.features.analytics) return

    return api.post('/api/v1/analytics/events', {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }, 100),

  trackPageView: async (page: string, properties?: Record<string, any>) => {
    return analyticsApi.trackEvent({
      name: 'page_view',
      properties: {
        page,
        ...properties
      }
    })
  },

  trackError: async (error: Error, context?: Record<string, any>) => {
    return analyticsApi.trackEvent({
      name: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context
      }
    })
  },

  getAnalytics: async (params: {
    startDate: string
    endDate: string
    events?: string[]
    groupBy?: 'day' | 'hour' | 'week'
  }) => {
    return api.get('/api/v1/analytics', { params })
  },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const isApiError = (error: any): error is AxiosError => {
  return error?.isAxiosError === true
}

export const getApiErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    // Try different error message formats
    if (error.response?.data) {
      const data = error.response.data
      const message = data.message || 
                     data.error || 
                     data.detail || 
                     data.msg ||
                     (typeof data === 'string' ? data : null)

      if (message && typeof message === 'string') {
        return message
      }

      // If we have data but no standard message field
      if (typeof data === 'object' && Object.keys(data).length > 0) {
        return `Erro da API (${error.response.status}): ${JSON.stringify(data)}`
      }
    }

    // Add status code to message if available
    const statusText = error.response?.status ? ` (${error.response.status})` : ''
    return (error.message || 'Erro de conexão com a API') + statusText
  }

  if (error && typeof error === 'object') {
    // Check if it's an empty object
    if (Object.keys(error).length === 0) {
      return 'Erro desconhecido - resposta vazia do servidor'
    }
    return error.message || `Erro: ${JSON.stringify(error)}` || 'Erro desconhecido'
  }

  return error?.toString() || 'Erro desconhecido'
}

export const checkApiHealth = async (): Promise<{
  isHealthy: boolean
  details: {
    reachable: boolean
    responseTime?: number
    error?: string
    suggestions: string[]
  }
}> => {
  const startTime = Date.now()
  const suggestions: string[] = []

  try {
    await systemApi.getHealth()
    const responseTime = Date.now() - startTime

    return {
      isHealthy: true,
      details: {
        reachable: true,
        responseTime,
        suggestions: responseTime > 5000 ? ['Backend está lento, verificar recursos'] : []
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    // Analyze error and provide suggestions
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      suggestions.push(
        'Verificar se o backend está executando na porta 8000',
        'Confirmar URL da API nas variáveis de ambiente',
        'Testar conectividade: curl http://0.0.0.0:8000/health'
      )
    } else if (error.code === 'ECONNREFUSED') {
      suggestions.push(
        'Backend não está escutando na porta 8000',
        'Reiniciar o serviço backend',
        'Verificar se a porta não está sendo usada por outro processo'
      )
    } else if (error.code === 'ECONNABORTED') {
      suggestions.push(
        'Timeout da requisição - backend muito lento',
        'Verificar recursos do servidor',
        'Aumentar timeout da requisição'
      )
    }

    console.error('API health check failed:', {
      error: error.message,
      code: error.code,
      responseTime,
      suggestions
    })

    return {
      isHealthy: false,
      details: {
        reachable: false,
        responseTime,
        error: error.message,
        suggestions
      }
    }
  }
}

export const getApiStats = () => ({
  client: api.getMetrics(),
  cache: api.getCacheStats(),
  queue: api.getQueueStats(),
})

// Auto-refresh token
if (typeof window !== 'undefined') {
  setInterval(async () => {
    const token = localStorage.getItem('mozaia_token')
    if (token) {
      try {
        await authApi.refreshToken()
      } catch (error) {
        console.error('Failed to refresh token:', error)
        // Token refresh failed, user will be redirected to login on next API call
      }
    }
  }, 15 * 60 * 1000) // Every 15 minutes
}

// Export enhanced API client as default
export default api