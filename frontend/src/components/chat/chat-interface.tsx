
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Plus, 
  Menu, 
  Settings, 
  User, 
  MessageSquare,
  Sparkles,
  ChevronDown,
  Share,
  RefreshCw
} from 'lucide-react'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { ChatSettings } from './chat-settings'
import { EmptyState } from './empty-state'
import { WelcomeScreen } from './welcome-screen'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { IntegrationTest } from './integration-test'

export function ChatInterface() {
  const {
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    startNewChat,
    regenerateLastResponse,
    stopStreaming,
  } = useChat()
  
  const { ui } = useChatStore()
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  useEffect(() => {
    if (isStreaming || (messages.length > 0 && !showScrollButton)) {
      scrollToBottom()
    }
  }, [messages, isStreaming, showScrollButton])

  const handleSendMessage = async (content: string, context?: any) => {
    await sendMessage(content, context)
  }

  const handleNewChat = () => {
    startNewChat()
  }

  const handleRegenerateResponse = async () => {
    await regenerateLastResponse()
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova conversa
              </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* Recent conversations would go here */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wider">
                  Hoje
                </div>
                {/* Mock conversation items */}
                <div className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    Explicação sobre programação
                  </div>
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    Desenvolvimento web moderno
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Usuário
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Mozaia AI
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!currentConversation && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-4">
              {/* Welcome Screen */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Como posso ajudá-lo hoje?
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Faça qualquer pergunta e obtenha respostas inteligentes com consenso de múltiplos modelos
                </p>

                {/* Example Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      💡 Explicar conceitos
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Como funciona a inteligência artificial?
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      🚀 Desenvolvimento
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Criar uma aplicação web moderna
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      📊 Análise de dados
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Interpretar estatísticas e tendências
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      ✍️ Redação
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Escrever textos profissionais
                    </div>
                  </div>
                </div>

                {/* Integration Test */}
                <div className="w-full max-w-2xl bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
                  <IntegrationTest />
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.length === 0 ? (
                  <EmptyState 
                    onStartChat={handleNewChat}
                    conversationContext={currentConversation?.context}
                  />
                ) : (
                  <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    onRegenerateResponse={handleRegenerateResponse}
                  />
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="absolute bottom-32 right-8 z-10 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200 dark:border-gray-700"
              >
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Message Input */}
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStopStreaming={stopStreaming}
                placeholder="Envie uma mensagem..."
              />
              
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  O Mozaia AI pode cometer erros. Considere verificar informações importantes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Settings Sidebar */}
        <AnimatePresence>
          {ui.chat_settings_open && <ChatSettings />}
        </AnimatePresence>
      </div>
    </div>
  )
}
