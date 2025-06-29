// Main chat page
import { ChatInterface } from '@/components/chat/chat-interface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat - Mozaia',
  description: 'Interface de chat inteligente',
}

export default function ChatPage() {
  return <ChatInterface />
}
