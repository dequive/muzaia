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
  Trash2,
  LogIn,
  LogOut,
  PanelLeft
} from 'lucide-react'
import { MessageInput } from './message-input'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ChatInterface() {
  const { user, signOut } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant' as const,
      content: 'Olá! Sou o Mozaia AI, seu assistente jurídico inteligente. Como posso ajudá-lo hoje?',
      timestamp: new Date().toISOString(),
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [handoffStatus, setHandoffStatus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Recebi sua mensagem: "${content}". Esta é uma resposta simulada do Mozaia AI. Como assistente jurídico, posso ajudá-lo com questões legais, análise de documentos e orientações jurídicas.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleStopStreaming = () => {
    setIsStreaming(false)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Olá! Sou o Mozaia AI, seu assistente jurídico inteligente. Como posso ajudá-lo hoje?',
        timestamp: new Date().toISOString(),
      }
    ])
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-80 bg-gray-900 dark:bg-gray-950 text-white flex flex-col border-r border-gray-700"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold">Mozaia AI</h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <Button
                onClick={handleNewChat}
                className="w-full bg-transparent hover:bg-gray-800 text-white border border-gray-600 hover:border-gray-500 h-11 rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3">
              <div className="space-y-1">
                <div className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 truncate">
                          Conversa atual
                        </div>
                        <div className="text-xs text-gray-400">
                          Agora mesmo
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-gray-700/50">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400">Online</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-gray-400 hover:text-white h-8 w-8 p-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Fazer Login
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 w-8 p-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mozaia AI
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    wsConnected ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {wsConnected ? 'Online' : 'Conectando...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              {!user && (
                <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                  Modo Público
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">Sistema não disponível. Verifique a ligação.</p>
            </div>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "group w-full border-b border-gray-100 dark:border-gray-700",
                  message.role === 'assistant' 
                    ? 'bg-gray-50 dark:bg-gray-750' 
                    : 'bg-white dark:bg-gray-800'
                )}
              >
                <div className="flex gap-4 py-6 px-4 md:px-6 lg:px-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      message.role === 'user'
                        ? "bg-emerald-500"
                        : "bg-gray-600 dark:bg-gray-700"
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-7">
                        {message.content}
                      </p>
                    </div>

                    {/* Action buttons for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="group w-full border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <div className="flex gap-4 py-6 px-4 md:px-6 lg:px-8">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">Mozaia está pensando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto">
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              placeholder="Envie uma mensagem para Mozaia..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}