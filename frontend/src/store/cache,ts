import { Cache } from '@/lib/cache'
import type { Conversation, Message } from '@/types'

export const cacheStore = {
  conversations: new Cache<Conversation[]>(1000 * 60 * 30), // 30 minutos
  messages: new Cache<Message[]>(1000 * 60 * 15), // 15 minutos
}
