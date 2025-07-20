import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session, ChatSettings, Conversation } from '@/types'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  chatSettings: ChatSettings
}

interface PersistedState extends AuthState, ChatState {
  ui: UIState
}

interface StoreState extends PersistedState {
  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  updateUI: (updates: Partial<UIState>) => void
  // ... outros actions
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      ui: {
        theme: 'system',
        sidebarOpen: true
      },
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      chatSettings: {
        language: 'pt',
        model: 'gpt-4',
        temperature: 0.7
      },

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setSession: (session) => set({ 
        session,
        user: session?.user || null,
        isAuthenticated: !!session
      }),

      updateUI: (updates) => set((state) => ({
        ui: { ...state.ui, ...updates }
      })),

      // ... outros actions
    }),
    {
      name: 'mozaia-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ui: state.ui,
        user: state.user,
        session: state.session,
        chatSettings: state.chatSettings,
        conversations: state.conversations.slice(0, 50)
      })
    }
  )
)

// Typed hooks
export const useAuth = () => {
  const store = useStore()
  return {
    user: store.user,
    session: store.session,
    isAuthenticated: store.isAuthenticated,
    setUser: store.setUser,
    setSession: store.setSession
  }
}

export const useUI = () => {
  const store = useStore()
  return {
    ui: store.ui,
    updateUI: store.updateUI
  }
}

export const useChatStore = () => {
  const store = useStore()
  return {
    conversations: store.conversations,
    currentConversation: store.currentConversation,
    messages: store.messages,
    isLoading: store.isLoading,
    isStreaming: store.isStreaming,
    chatSettings: store.chatSettings
  }
}

export const useUIStore = () => {
  const store = useStore()
  return {
    ui: store.ui,
    updateUI: store.updateUI
  }
}

export const chatActions = {
  // Add chat actions here when implemented
}
