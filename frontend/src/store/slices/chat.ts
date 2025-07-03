import { StateCreator } from 'zustand'
import type { ChatSlice, Message, Conversation } from '@/types'

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  // Estado
  conversations: [],
  currentConversation: null,
  messages: [],
  
  // Ações
  addMessage: (message: Message) =>
    set((state) => {
      const conversations = [...state.conversations]
      const conversation = conversations.find(c => c.id === message.conversation_id)
      
      if (conversation) {
        conversation.updated_at = message.created_at
        conversation.message_count = (conversation.message_count || 0) + 1
      }
      
      return {
        messages: [...state.messages, message],
        conversations
      }
    }),
    
  updateMessage: (id: string, updates: Partial<Message>) =>
    set((state) => {
      const messages = [...state.messages]
      const index = messages.findIndex(m => m.id === id)
      
      if (index !== -1) {
        messages[index] = { ...messages[index], ...updates }
      }
      
      return { messages }
    }),
    
  deleteMessage: (id: string) =>
    set((state) => {
      const messages = state.messages.filter(m => m.id !== id)
      return { messages }
    })
})
