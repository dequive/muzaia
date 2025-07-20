
import { Metadata } from 'next'
import { ChatInterface } from '@/components/chat/chat-interface'

export const metadata: Metadata = {
  title: 'Chat - Mozaia',
  description: 'Interface de chat inteligente',
}

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <ChatInterface />
    </div>
  )
}
