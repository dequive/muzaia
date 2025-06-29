// Main store using Zustand
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  AppStore,
  User,
  Session,
  UIState,
  Conversation,
  Message,
  ChatSettings,
  ContextType,
} from '@/types';

// Initial states
const initialUIState: UIState = {
  theme: 'system',
  sidebar_collapsed: false,
  chat_settings_open: false,
  notifications_enabled: true,
  sound_enabled: false,
  language: 'pt-MZ',
};

const initialChatSettings: ChatSettings = {
  default_context: 'general',
  generation_params: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
  },
  auto_save: true,
  show_model_responses: false,
  show_confidence_scores: true,
  enable_streaming: true,
};

// Main store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
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

          // Auth actions
          setUser: (user: User | null) =>
            set((state) => {
              state.user = user;
              state.isAuthenticated = !!user;
            }),

          setSession: (session: Session | null) =>
            set((state) => {
              state.session = session;
              state.user = session?.user || null;
              state.isAuthenticated = !!session;
            }),

          // UI actions
          updateUI: (updates: Partial<UIState>) =>
            set((state) => {
              Object.assign(state.ui, updates);
            }),

          // Chat actions
          addMessage: (message: Message) =>
            set((state) => {
              state.messages.push(message);
            }),

          updateMessage: (id: string, updates: Partial<Message>) =>
            set((state) => {
              const index = state.messages.findIndex((m) => m.id === id);
              if (index !== -1) {
                Object.assign(state.messages[index], updates);
              }
            }),

          setCurrentConversation: (conversation: Conversation | null) =>
            set((state) => {
              state.currentConversation = conversation;
              // Clear messages when switching conversations
              if (conversation?.id !== state.currentConversation?.id) {
                state.messages = [];
              }
            }),

          updateChatSettings: (settings: Partial<ChatSettings>) =>
            set((state) => {
              Object.assign(state.chatSettings, settings);
            }),

          // Computed getters
          getCurrentMessages: () => {
            const { messages, currentConversation } = get();
            return messages.filter(
              (m) => m.conversation_id === currentConversation?.id
            );
          },

          getMessageById: (id: string) => {
            const { messages } = get();
            return messages.find((m) => m.id === id);
          },

          getConversationById: (id: string) => {
            const { conversations } = get();
            return conversations.find((c) => c.id === id);
          },
        }))
      ),
      {
        name: 'mozaia-store',
        partialize: (state) => ({
          // Only persist these parts of the state
          ui: state.ui,
          chatSettings: state.chatSettings,
          user: state.user,
          conversations: state.conversations,
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle migrations between versions
          if (version === 0) {
            // Migration from version 0 to 1
            persistedState.ui = { ...initialUIState, ...persistedState.ui };
            persistedState.chatSettings = { ...initialChatSettings, ...persistedState.chatSettings };
          }
          return persistedState;
        },
      }
    ),
    {
      name: 'mozaia-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Store slices for better organization
export const useAuthStore = () => {
  const { user, session, isAuthenticated, setUser, setSession } = useAppStore();
  return { user, session, isAuthenticated, setUser, setSession };
};

export const useUIStore = () => {
  const { ui, updateUI } = useAppStore();
  return { ui, updateUI };
};

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
    setCurrentConversation,
    updateChatSettings,
    getCurrentMessages,
    getMessageById,
    getConversationById,
  } = useAppStore();

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    chatSettings,
    addMessage,
    updateMessage,
    setCurrentConversation,
    updateChatSettings,
    getCurrentMessages,
    getMessageById,
    getConversationById,
  };
};

// Selectors for performance optimization
export const useCurrentUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useTheme = () => useAppStore((state) => state.ui.theme);
export const useCurrentConversation = () => useAppStore((state) => state.currentConversation);
export const useCurrentMessages = () => useAppStore((state) => 
  state.messages.filter(m => m.conversation_id === state.currentConversation?.id)
);

// Action creators for complex operations
export const chatActions = {
  startNewConversation: (title: string, context: ContextType = 'general') => {
    const { setCurrentConversation } = useAppStore.getState();
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      user_id: useAppStore.getState().user?.id || '',
      title,
      context,
      status: 'active',
      message_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setCurrentConversation(newConversation);
    return newConversation;
  },

  addUserMessage: (content: string, conversationId?: string) => {
    const { addMessage, currentConversation, user } = useAppStore.getState();
    const convI
