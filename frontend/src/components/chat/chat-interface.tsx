
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
  RefreshCw,
  Sun,
  Moon,
  History,
  Edit3,
  Trash2
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
  const [isDark, setIsDark] = useState(false)
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

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  // Mock conversation data
  const conversations = [
    { id: '1', title: 'Explicação sobre programação', timestamp: '2024-01-15' },
    { id: '2', title: 'Desenvolvimento web moderno', timestamp: '2024-01-14' },
    { id: '3', title: 'Análise de dados com Python', timestamp: '2024-01-13' },
    { id: '4', title: 'Machine Learning básico', timestamp: '2024-01-12' },
  ]

  return (
    <div className={cn("flex h-screen bg-white dark:bg-gray-800", isDark ? "dark" : "")}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-64 bg-gray-900 dark:bg-gray-900 text-white flex flex-col border-r border-white/20"
          >
            {/* Sidebar Header */}
            <div className="p-3">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start bg-transparent border border-white/20 hover:bg-white/10 text-white h-12 rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-3" />
                Nova conversa
              </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageSquare className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 truncate font-medium">
                          {conv.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-md">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-md">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 bg-gray-700">
                    <AvatarFallback className="text-white bg-gray-700">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-white">
                    Usuário
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-black/10 dark:border-white/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Mozaia AI
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleTheme}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!currentConversation && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 w-full">
              {/* Welcome Screen */}
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-normal text-gray-900 dark:text-white mb-6">
                  Como posso ajudá-lo hoje?
                </h2>

                {/* Example Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-sm">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      💡 Explicar conceitos
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Como funciona a inteligência artificial?
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md">
                    <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      🚀 Desenvolvimento
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Criar uma aplicação web moderna
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md">
                    <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      📊 Análise de dados
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Interpretar estatísticas e tendências
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md">
                    <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      ✍️ Redação
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Escrever textos profissionais
                    </div>
                  </div>
                </div>

                {/* Integration Test */}
                <div className="w-full max-w-2xl bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <IntegrationTest />
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto bg-white dark:bg-gray-800"
            >
              <div className="max-w-3xl mx-auto">
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
                className="absolute bottom-32 right-8 z-10 h-12 w-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center border border-gray-200 dark:border-gray-700"
              >
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Message Input */}
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStopStreaming={stopStreaming}
                placeholder="Envie uma mensagem para o Mozaia AI..."
              />
              
              <div className="text-center mt-3">
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
