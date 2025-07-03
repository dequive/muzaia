import { createSelector } from 'reselect'
import type { RootState } from '@/types'

export const selectUnreadMessages = createSelector(
  [(state: RootState) => state.messages, (state: RootState) => state.user],
  (messages, user) => 
    messages.filter(m => 
      m.role === 'assistant' && 
      !m.read_at && 
      m.user_id !== user?.id
    )
)

export const selectUnreadCount = createSelector(
  [selectUnreadMessages],
  (messages) => messages.length
)

export const selectCurrentConversationMessages = createSelector(
  [
    (state: RootState) => state.messages,
    (state: RootState) => state.currentConversation
  ],
  (messages, currentConversation) =>
    messages.filter(m => m.conversation_id === currentConversation?.id)
)
