import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { config, isDev } from '@/lib/config'
import { generateId, debounce } from '@/lib/utils'
import type {
  AppStore,
  User,
  Session,
  UIState,
  Conversation,
  Message,
  ChatSettings,
  ContextType,
  ErrorState,
  LoadingState,
  NotificationState,
  PerformanceMetrics,
} from '@/types'

// =============================================================================
// ENHANCED TYPES
// =============================================================================

interface OptimisticUpdate<T = any> {
  id: string
  type: string
  data: T
  timestamp: number
  rollback: () => void
}

interface SyncState {
  lastSync: number
  pendingActions: Array<{
    id: string
    type: string
    payload: any
    timestamp: number
  }>
  conflicts: Array<{
    id: string
    local: any
    remote: any
    timestamp: number
  }>
}

interface CacheState {
  conversations: Record<string, { data: Conversation; timestamp: number }>
  messages: Record<string, { data: Message[]; timestamp: number }>
  users: Record<string, { data: User; timestamp: number }>
}

// Enhanced store interface
interface EnhancedAppStore extends AppStore {
  // Enhanced state
  error: ErrorState | null
  loading: LoadingState
  notifications: NotificationState[]
  optimisticUpdates: OptimisticUpdate[]
  sync: SyncState
  cache: CacheState
  performance: PerformanceMetrics
  
  // Enhanced actions
  setError: (error: ErrorState | null) => void
  setLoading: (key: keyof LoadingState, value: boolean) => void
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  addOptimisticUpdate: (update: Omit<OptimisticUpdate, 'id' | 'timestamp'>) => void
  removeOptimisticUpdate: (id: string) => void
  rollbackOptimisticUpdate: (id: string) => void
  updateSyncState: (updates: Partial<SyncState>) => void
  updateCache: (type: keyof CacheState, key: string, data: any) => void
  clearCache: (type?: keyof CacheState) => void
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void
  
  // Batch operations
  batchUpdate: (updates: Array<() => void>) => void
  
  // Advanced selectors
  getMessagesByConversation: (conversationId: string) => Message[]
  getUnreadMessagesCount: () => number
  getActiveNotifications: () => NotificationState[]
  getPendingActions: () => SyncState['pendingActions']
  
  // Utility actions
  reset: () => void
  clearUserData: () => void
  exportState: () => string
  importState: (state: string) => void
}

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialUIState: UIState = {
  theme: 'system',
  sidebar_collapsed: false,
  chat_settings_open: false,
  notifications_enabled: true,
  sound_enabled: false,
  language: 'pt-MZ',
  compact_mode: false,
  show_timestamps: true,
  auto_scroll: true,
  keyboard_shortcuts: true,
}

const initialChatSettings: ChatSettings = {
  default_context: 'general',
  generation_params: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  auto_save: true,
  show_model_responses: false,
  show_confidence_scores: true,
  enable_streaming: true,
  auto_title: true,
  save_history: true,
  max_context_length: 4000,
}

const initialLoadingState: LoadingState = {
  app: false,
  auth: false,
  conversations: false,
  messages: false,
  upload: false,
  generation: false,
  sync: false,
}

const initialSyncState: SyncState = {
  lastSync: 0,
  pendingActions: [],
  conflicts: [],
}

const initialCacheState: CacheState = {
  conversations: {},
  messages: {},
  users: {},
}

const initialPerformanceMetrics: PerformanceMetrics = {
  renderTime: 0,
  apiLatency: 0,
  memoryUsage: 0,
  cacheHitRate: 0,
  errorRate: 0,
  lastMeasurement: Date.now(),
}

// =============================================================================
// CUSTOM MIDDLEWARES
// =============================================================================

/**
 * Middleware para analytics e métricas
 */
const analyticsMiddleware = (f: any) => (set: any, get: any, api: any) => {
  const analytics = {
    trackAction: (action: string, payload?: any) => {
      if (config.features.analytics) {
        // Track action for analytics
        console.log('Analytics:', { action, payload, timestamp: Date.now() })
      }
    },
    
    measurePerformance: <T>(fn: () => T, metric: string): T => {
      const start = performance.now()
      const result = fn()
      const duration = performance.now() - start
      
      const state = get()
      set((draft: any) => {
        draft.performance[metric] = duration
        draft.performance.lastMeasurement = Date.now()
      })
      
      return result
    }
  }
  
  return f(
    (...args: any[]) => {
      const action = args[0]
      if (typeof action === 'function') {
        return analytics.measurePerformance(() => set(...args), 'renderTime')
      }
      return set(...args)
    },
    get,
    { ...api, analytics }
  )
}

/**
 * Middleware para sincronização
 */
const syncMiddleware = (f: any) => (set: any, get: any, api: any) => {
  const sync = {
    addPendingAction: (type: string, payload: any) => {
      set((state: any) => {
        state.sync.pendingActions.push({
          id: generateId(),
          type,
          payload,
          timestamp: Date.now(),
        })
      })
    },
    
    processPendingActions: async () => {
      const state = get()
      const pending = state.sync.pendingActions
      
      for (const action of pending) {
        try {
          // Process action
          await processAction(action)
          
          // Remove from pending
          set((state: any) => {
            state.sync.pendingActions = state.sync.pendingActions.filter(
              (a: any) => a.id !== action.id
            )
          })
        } catch (error) {
          console.error('Failed to process pending action:', error)
        }
      }
    }
  }
  
  return f(set, get, { ...api, sync })
}

async function processAction(action: any) {
  // Implementation for processing sync actions
  console.log('Processing action:', action)
}

// =============================================================================
// MAIN STORE
// =============================================================================

export const useAppStore = create<EnhancedAppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        temporal(
          immer(
            analyticsMiddleware(
              syncMiddleware((set, get, api) => ({
                // Auth state
                user: null,
                session: null,
                isAuthenticated: false,

                // UI state
                ui: initialUIState,

                // Chat state
                conversations: [],
                currentConversation: null,
                messages: [],
                isLoading: false,
                isStreaming: false,

                // Settings
                chatSettings: initialChatSettings,

                // Enhanced state
                error: null,
                loading: initialLoadingState,
                notifications: [],
                optimisticUpdates: [],
                sync: initialSyncState,
                cache: initialCacheState,
                performance: initialPerformanceMetrics,

                // Auth actions
                setUser: (user: User | null) =>
                  set((state) => {
                    state.user = user
                    state.isAuthenticated = !!user
                    api.analytics?.trackAction('set_user', { userId: user?.id })
                  }),

                setSession: (session: Session | null) =>
                  set((state) => {
                    state.session = session
                    state.user = session?.user || null
                    state.isAuthenticated = !!session
                    api.analytics?.trackAction('set_session', { sessionId: session?.id })
                  }),

                // UI actions
                updateUI: (updates: Partial<UIState>) =>
                  set((state) => {
                    Object.assign(state.ui, updates)
                    api.analytics?.trackAction('update_ui', updates)
                  }),

                // Chat actions
                addMessage: (message: Message) =>
                  set((state) => {
                    state.messages.push(message)
                    
                    // Update conversation's last message time
                    const conversation = state.conversations.find(c => c.id === message.conversation_id)
                    if (conversation) {
                      conversation.updated_at = message.created_at
                      conversation.message_count = (conversation.message_count || 0) + 1
                    }
                    
                    api.analytics?.trackAction('add_message', { 
                      messageId: message.id,
                      conversationId: message.conversation_id 
                    })
                  }),

                updateMessage: (id: string, updates: Partial<Message>) =>
                  set((state) => {
                    const index = state.messages.findIndex((m) => m.id === id)
                    if (index !== -1) {
                      Object.assign(state.messages[index], updates)
                      state.messages[index].updated_at = new Date().toISOString()
                    }
                    api.analytics?.trackAction('update_message', { messageId: id, updates })
                  }),

                deleteMessage: (id: string) =>
                  set((state) => {
                    const messageIndex = state.messages.findIndex(m => m.id === id)
                    if (messageIndex !== -1) {
                      const message = state.messages[messageIndex]
                      state.messages.splice(messageIndex, 1)
                      
                      // Update conversation message count
                      const conversation = state.conversations.find(c => c.id === message.conversation_id)
                      if (conversation && conversation.message_count > 0) {
                        conversation.message_count--
                      }
                    }
                    api.analytics?.trackAction('delete_message', { messageId: id })
                  }),

                setCurrentConversation: (conversation: Conversation | null) =>
                  set((state) => {
                    state.currentConversation = conversation
                    // Clear messages when switching conversations
                    if (conversation?.id !== state.currentConversation?.id) {
                      state.messages = []
                    }
                    api.analytics?.trackAction('set_current_conversation', { 
                      conversationId: conversation?.id 
                    })
                  }),

                addConversation: (conversation: Conversation) =>
                  set((state) => {
                    state.conversations.unshift(conversation)
                    api.analytics?.trackAction('add_conversation', { conversationId: conversation.id })
                  }),

                updateConversation: (id: string, updates: Partial<Conversation>) =>
                  set((state) => {
                    const index = state.conversations.findIndex(c => c.id === id)
                    if (index !== -1) {
                      Object.assign(state.conversations[index], updates)
                      state.conversations[index].updated_at = new Date().toISOString()
                    }
                    
                    // Update current conversation if it's the same
                    if (state.currentConversation?.id === id) {
                      Object.assign(state.currentConversation, updates)
                    }
                    
                    api.analytics?.trackAction('update_conversation', { conversationId: id, updates })
                  }),

                deleteConversation: (id: string) =>
                  set((state) => {
                    state.conversations = state.conversations.filter(c => c.id !== id)
                    
                    // Clear current conversation if it's the deleted one
                    if (state.currentConversation?.id === id) {
                      state.currentConversation = null
                      state.messages = []
                    }
                    
                    // Remove related messages
                    state.messages = state.messages.filter(m => m.conversation_id !== id)
                    
                    api.analytics?.trackAction('delete_conversation', { conversationId: id })
                  }),

                setConversations: (conversations: Conversation[]) =>
                  set((state) => {
                    state.conversations = conversations
                  }),

                setMessages: (messages: Message[]) =>
                  set((state) => {
                    state.messages = messages
                  }),

                updateChatSettings: (settings: Partial<ChatSettings>) =>
                  set((state) => {
                    Object.assign(state.chatSettings, settings)
                    api.analytics?.trackAction('update_chat_settings', settings)
                  }),

                // Enhanced actions
                setError: (error: ErrorState | null) =>
                  set((state) => {
                    state.error = error
                    if (error) {
                      api.analytics?.trackAction('set_error', { 
                        code: error.code,
                        message: error.message 
                      })
                    }
                  }),

                setLoading: (key: keyof LoadingState, value: boolean) =>
                  set((state) => {
                    state.loading[key] = value
                  }),

                addNotification: (notification) =>
                  set((state) => {
                    const newNotification: NotificationState = {
                      ...notification,
                      id: generateId(),
                      timestamp: Date.now(),
                    }
                    state.notifications.push(newNotification)
                    
                    // Auto-remove after duration
                    if (notification.duration) {
                      setTimeout(() => {
                        get().removeNotification(newNotification.id)
                      }, notification.duration)
                    }
                  }),

                removeNotification: (id: string) =>
                  set((state) => {
                    state.notifications = state.notifications.filter(n => n.id !== id)
                  }),

                clearNotifications: () =>
                  set((state) => {
                    state.notifications = []
                  }),

                addOptimisticUpdate: (update) =>
                  set((state) => {
                    const optimisticUpdate: OptimisticUpdate = {
                      ...update,
                      id: generateId(),
                      timestamp: Date.now(),
                    }
                    state.optimisticUpdates.push(optimisticUpdate)
                  }),

                removeOptimisticUpdate: (id: string) =>
                  set((state) => {
                    state.optimisticUpdates = state.optimisticUpdates.filter(u => u.id !== id)
                  }),

                rollbackOptimisticUpdate: (id: string) =>
                  set((state) => {
                    const update = state.optimisticUpdates.find(u => u.id === id)
                    if (update) {
                      update.rollback()
                      state.optimisticUpdates = state.optimisticUpdates.filter(u => u.id !== id)
                    }
                  }),

                updateSyncState: (updates: Partial<SyncState>) =>
                  set((state) => {
                    Object.assign(state.sync, updates)
                  }),

                updateCache: (type: keyof CacheState, key: string, data: any) =>
                  set((state) => {
                    state.cache[type][key] = {
                      data,
                      timestamp: Date.now(),
                    }
                  }),

                clearCache: (type?: keyof CacheState) =>
                  set((state) => {
                    if (type) {
                      state.cache[type] = {}
                    } else {
                      state.cache = initialCacheState
                    }
                  }),

                updatePerformance: (metrics: Partial<PerformanceMetrics>) =>
                  set((state) => {
                    Object.assign(state.performance, metrics)
                    state.performance.lastMeasurement = Date.now()
                  }),

                batchUpdate: (updates: Array<() => void>) =>
                  set((state) => {
                    updates.forEach(update => update())
                  }),

                // Advanced selectors
                getMessagesByConversation: (conversationId: string) => {
                  const { messages } = get()
                  return messages.filter(m => m.conversation_id === conversationId)
                },

                getUnreadMessagesCount: () => {
                  const { messages, user } = get()
                  return messages.filter(m => 
                    m.role === 'assistant' && 
                    !m.read_at && 
                    m.user_id !== user?.id
                  ).length
                },

                getActiveNotifications: () => {
                  const { notifications } = get()
                  const now = Date.now()
                  return notifications.filter(n => 
                    !n.duration || (now - n.timestamp) < n.duration
                  )
                },

                getPendingActions: () => {
                  const { sync } = get()
                  return sync.pendingActions
                },

                // Computed getters (legacy)
                getCurrentMessages: () => {
                  const { messages, currentConversation } = get()
                  return messages.filter(
                    (m) => m.conversation_id === currentConversation?.id
                  )
                },

                getMessageById: (id: string) => {
                  const { messages } = get()
                  return messages.find((m) => m.id === id)
                },

                getConversationById: (id: string) => {
                  const { conversations } = get()
                  return conversations.find((c) => c.id === id)
                },

                // Utility actions
                reset: () =>
                  set(() => ({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                    ui: initialUIState,
                    conversations: [],
                    currentConversation: null,
                    messages: [],
                    isLoading: false,
                    isStreaming: false,
                    chatSettings: initialChatSettings,
                    error: null,
                    loading: initialLoadingState,
                    notifications: [],
                    optimisticUpdates: [],
                    sync: initialSyncState,
                    cache: initialCacheState,
                    performance: initialPerformanceMetrics,
                  })),

                clearUserData: () =>
                  set((state) => {
                    state.conversations = []
                    state.currentConversation = null
                    state.messages = []
                    state.cache = initialCacheState
                    state.sync = initialSyncState
                  }),

                exportState: () => {
                  const state = get()
                  return JSON.stringify({
                    conversations: state.conversations,
                    messages: state.messages,
                    chatSettings: state.chatSettings,
                    ui: state.ui,
                    exportedAt: new Date().toISOString(),
                  })
                },

                importState: (stateString: string) => {
                  try {
                    const importedState = JSON.parse(stateString)
                    set((state) => {
                      if (importedState.conversations) state.conversations = importedState.conversations
                      if (importedState.messages) state.messages = importedState.messages
                      if (importedState.chatSettings) state.chatSettings = importedState.chatSettings
                      if (importedState.ui) state.ui = { ...state.ui, ...importedState.ui }
                    })
                  } catch (error) {
                    console.error('Failed to import state:', error)
                  }
                },
              }))
            )
          ),
          {
            limit: 50, // Limit undo/redo history
            equality: (a, b) => a === b,
            partialize: (state) => ({
              conversations: state.conversations,
              messages: state.messages,
              currentConversation: state.currentConversation,
            }),
          }
        )
      ),
      {
        name: 'mozaia-store',
        partialize: (state) => ({
          // Only persist these parts of the state
          ui: state.ui,
          chatSettings: state.chatSettings,
          user: state.user,
          conversations: state.conversations.slice(0, 50), // Limit persisted conversations
        }),
        version: 2,
        migrate: (persistedState: any, version: number) => {
          // Handle migrations between versions
          if (version === 0) {
            persistedState.ui = { ...initialUIState, ...persistedState.ui }
            persistedState.chatSettings = { ...initialChatSettings, ...persistedState.chatSettings }
          }
          if (version === 1) {
            // Migration from version 1 to 2
            persistedState.ui.compact_mode = false
            persistedState.ui.show_timestamps = true
            persistedState.ui.auto_scroll = true
            persistedState.ui.keyboard_shortcuts = true
          }
          return persistedState
        },
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.error('Failed to rehydrate state:', error)
            } else if (state) {
              console.log('State rehydrated successfully')
              // Initialize runtime state
              state.loading = initialLoadingState
              state.notifications = []
              state.optimisticUpdates = []
              state.error = null
            }
          }
        },
      }
    ),
    {
      name: 'mozaia-store',
      enabled: isDev,
    }
  )
)

// =============================================================================
// STORE SLICES
// =============================================================================

export const useAuthStore = () => {
  const { user, session, isAuthenticated, setUser, setSession } = useAppStore()
  return { user, session, isAuthenticated, setUser, setSession }
}

export const useUIStore = () => {
  const { ui, updateUI } = useAppStore()
  return { ui, updateUI }
}

export const useChatStore = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    chatSettings,
    addMessage,
    updateMessage,
    deleteMessage,
    setCurrentConversation,
    addConversation,
    updateConversation,
    deleteConversation,
    setConversations,
    setMessages,
    updateChatSettings,
    getCurrentMessages,
    getMessageById,
    getConversationById,
    getMessagesByConversation,
  } = useAppStore()

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    chatSettings,
    addMessage,
    updateMessage,
    deleteMessage,
    setCurrentConversation,
    addConversation,
    updateConversation,
    deleteConversation,
    setConversations,
    setMessages,
    updateChatSettings,
    getCurrentMessages,
    getMessageById,
    getConversationById,
    getMessagesByConversation,
  }
}

export const useErrorStore = () => {
  const { error, setError } = useAppStore()
  return { error, setError }
}

export const useLoadingStore = () => {
  const { loading, setLoading } = useAppStore()
  return { loading, setLoading }
}

export const useNotificationStore = () => {
  const { 
    notifications, 
    addNotification, 
    removeNotification, 
    clearNotifications,
    getActiveNotifications 
  } = useAppStore()
  
  return { 
    notifications, 
    addNotification, 
    removeNotification, 
    clearNotifications,
    getActiveNotifications 
  }
}

// =============================================================================
// OPTIMIZED SELECTORS
// =============================================================================

export const useCurrentUser = () => useAppStore((state) => state.user)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useTheme = () => useAppStore((state) => state.ui.theme)
export const useCurrentConversation = () => useAppStore((state) => state.currentConversation)
export const useCurrentMessages = () => useAppStore((state) => 
  state.messages.filter(m => m.conversation_id === state.currentConversation?.id)
)
export const useUnreadCount = () => useAppStore((state) => state.getUnreadMessagesCount())
export const useActiveNotifications = () => useAppStore((state) => state.getActiveNotifications())
export const useHasPendingActions = () => useAppStore((state) => state.sync.pendingActions.length > 0)
export const usePerformanceMetrics = () => useAppStore((state) => state.performance)

// =============================================================================
// ACTION CREATORS
// =============================================================================

export const chatActions = {
  startNewConversation: (title: string, context: ContextType = 'general') => {
    const { setCurrentConversation, addConversation, user } = useAppStore.getState()
    
    const newConversation: Conversation = {
      id: generateId(),
      user_id: user?.id || '',
      title,
      context,
      status: 'active',
      message_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    addConversation(newConversation)
    setCurrentConversation(newConversation)
    return newConversation
  },

  addUserMessage: (content: string, conversationId?: string) => {
    const { addMessage, currentConversation, user } = useAppStore.getState()
    
    const convId = conversationId || currentConversation?.id
    if (!convId || !user) return null

    const newMessage: Message = {
      id: generateId(),
      conversation_id: convId,
      user_id: user.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    addMessage(newMessage)
    return newMessage
  },

  addAssistantMessage: (content: string, conversationId?: string, metadata?: any) => {
    const { addMessage, currentConversation } = useAppStore.getState()
    
    const convId = conversationId || currentConversation?.id
    if (!convId) return null

    const newMessage: Message = {
      id: generateId(),
      conversation_id: convId,
      user_id: 'assistant',
      role: 'assistant',
      content,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    addMessage(newMessage)
    return newMessage
  },

  optimisticUpdate: <T>(
    type: string,
    data: T,
    rollback: () => void
  ) => {
    const { addOptimisticUpdate } = useAppStore.getState()
    addOptimisticUpdate({ type, data, rollback })
  },
}

export const uiActions = {
  showNotification: (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration = 5000
  ) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type,
      message,
      duration,
    })
  },

  showError: (error: string | Error, code?: string) => {
    const { setError, addNotification } = useAppStore.getState()
    
    const errorMessage = typeof error === 'string' ? error : error.message
    
    setError({
      message: errorMessage,
      code: code || 'UNKNOWN_ERROR',
      timestamp: Date.now(),
    })
    
    uiActions.showNotification(errorMessage, 'error')
  },

  clearError: () => {
    const { setError } = useAppStore.getState()
    setError(null)
  },

  toggleTheme: () => {
    const { ui, updateUI } = useAppStore.getState()
    const newTheme = ui.theme === 'light' ? 'dark' : ui.theme === 'dark' ? 'system' : 'light'
    updateUI({ theme: newTheme })
  },

  toggleSidebar: () => {
    const { ui, updateUI } = useAppStore.getState()
    updateUI({ sidebar_collapsed: !ui.sidebar_collapsed })
  },
}

export const syncActions = {
  addPendingAction: (type: string, payload: any) => {
    const { updateSyncState, sync } = useAppStore.getState()
    
    updateSyncState({
      pendingActions: [
        ...sync.pendingActions,
        {
          id: generateId(),
          type,
          payload,
          timestamp: Date.now(),
        },
      ],
    })
  },

  markSynced: () => {
    const { updateSyncState } = useAppStore.getState()
    updateSyncState({
      lastSync: Date.now(),
      pendingActions: [],
    })
  },
}

// =============================================================================
// HOOKS FOR COMPLEX OPERATIONS
// =============================================================================

export const useOptimisticUpdates = () => {
  const { optimisticUpdates, addOptimisticUpdate, removeOptimisticUpdate, rollbackOptimisticUpdate } = useAppStore()
  
  const performOptimisticUpdate = <T>(
    type: string,
    data: T,
    asyncOperation: () => Promise<void>,
    rollback: () => void
  ) => {
    const updateId = generateId()
    
    // Add optimistic update
    addOptimisticUpdate({
      id: updateId,
      type,
      data,
      rollback,
      timestamp: Date.now(),
    })
    
    // Perform async operation
    asyncOperation()
      .then(() => {
        // Success - remove optimistic update
        removeOptimisticUpdate(updateId)
      })
      .catch(() => {
        // Error - rollback
        rollbackOptimisticUpdate(updateId)
      })
  }
  
  return {
    optimisticUpdates,
    performOptimisticUpdate,
  }
}

export const useStorePerformance = () => {
  const { performance, updatePerformance } = useAppStore()
  
  const measureOperation = <T>(operation: () => T, metric: string): T => {
    const start = performance.now()
    const result = operation()
    const duration = performance.now() - start
    
    updatePerformance({ [metric]: duration })
    
    return result
  }
  
  return {
    performance,
    measureOperation,
  }
}

// =============================================================================
// AUTO-SYNC SETUP
// =============================================================================

if (typeof window !== 'undefined') {
  // Auto-sync when online
  window.addEventListener('online', () => {
    const { sync } = useAppStore.getState()
    if (sync.pendingActions.length > 0) {
      console.log('Back online, processing pending actions...')
      // Process pending actions
    }
  })
  
  // Performance monitoring
  if (config.monitoring.enabled) {
    setInterval(() => {
      const { updatePerformance } = useAppStore.getState()
      
      // Measure memory usage
      if (performance.memory) {
        updatePerformance({
          memoryUsage: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
        })
      }
    }, 60000) // Every minute
  }
}

// Export temporal actions for undo/redo
export const {
  undo,
  redo,
  clear: clearHistory,
} = useAppStore.temporal.getState()
