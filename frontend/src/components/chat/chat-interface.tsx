
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
  PanelLeft,
  Upload,
  Paperclip,
  Mic,
  Phone,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { MessageInput } from './message-input'
import { MessageList } from './message-list'
import { WelcomeScreen } from './welcome-screen'
import { EmptyState } from './empty-state'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Message, ContextType } from '@/types'

interface HandoffRequest {
  id: string
  user_name: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  status: 'pending' | 'accepted' | 'completed'
}

export function ChatInterface() {
  const { user, signOut } = useAuth()
  const { messages, conversations, sendMessage, isLoading } = useChat()
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([])
  const [showHandoffPanel, setShowHandoffPanel] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [contextType, setContextType] = useState<ContextType>('legal')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // WebSocket connection 
  useEffect(() => {
    if (!user?.id) return

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/user/${user.id}`)
    
    ws.onopen = () => {
      setWsConnected(true)
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }
    
    ws.onclose = () => {
      setWsConnected(false)
      console.log('WebSocket disconnected')
    }

    return () => ws.close()
  }, [user?.id])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    try {
      setIsStreaming(true)
      
      const messageData = {
        content,
        context_type: contextType,
        attachments: attachedFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }))
      }
      
      await sendMessage(messageData)
      setAttachedFiles([])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleStopStreaming = () => {
    setIsStreaming(false)
  }

  const handleNewChat = () => {
    setCurrentConversation(null)
    // Clear messages or create new conversation
  }

  const handleFileAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.sender_type !== 'user') {
          // Add message from AI or technician
          const newMessage = {
            id: Date.now().toString(),
            role: data.sender_type === 'technician' ? 'assistant' : 'assistant',
            content: data.content,
            timestamp: data.timestamp,
            isStreaming: false
          }
          // Add to messages state - this would need to be connected to your chat state
        }
        break
      
      case 'handoff_accepted':
        setShowHandoffPanel(false)
        // Show technician connected notification
        break
      
      case 'typing_indicator':
        if (data.sender_type === 'technician') {
          // Show typing indicator from technician
        }
        break
    }
  }

  const handleHandoffRequest = async () => {
    const request: HandoffRequest = {
      id: Date.now().toString(),
      user_name: user?.email || 'Usuário Anônimo',
      reason: 'Solicitação de transferência para técnico humano',
      priority: 'medium',
      created_at: new Date().toISOString(),
      status: 'pending'
    }
    
    setHandoffRequests(prev => [...prev, request])
    setShowHandoffPanel(true)e)
  }

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
    // Implement voice recording logic
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* File input hidden */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

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

            {/* Context Selector */}
            <div className="px-3 mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Contexto</label>
              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value as ContextType)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="legal">Jurídico</option>
                <option value="business">Negócios</option>
                <option value="technical">Técnico</option>
                <option value="general">Geral</option>
              </select>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div key={conv.id} className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-100 truncate">
                            {conv.title || 'Nova Conversa'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(conv.updated_at).toLocaleDateString()}
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
                ))}
              </div>
            </div>

            {/* Handoff Panel Toggle */}
            {handoffRequests.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700">
                <Button
                  onClick={() => setShowHandoffPanel(!showHandoffPanel)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Solicitações ({handoffRequests.length})
                </Button>
              </div>
            )}

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

      {/* Handoff Panel */}
      <AnimatePresence>
        {showHandoffPanel && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Transferências</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHandoffPanel(false)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {handoffRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{request.user_name}</div>
                        <div className="text-xs text-gray-500 mt-1">{request.reason}</div>
                      </div>
                      <Badge 
                        variant={
                          request.priority === 'urgent' ? 'destructive' :
                          request.priority === 'high' ? 'warning' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-3 space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  Mozaia AI - Assistente Jurídico
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    wsConnected ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {wsConnected ? 'Online' : 'Conectando...'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {contextType}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileAttachment}
                className="h-8 w-8 p-0"
                title="Anexar documento"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-8 w-8 p-0",
                  isRecording && "text-red-500 bg-red-50 dark:bg-red-900/20"
                )}
                title="Gravação de voz"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHandoffRequest}
                className="h-8 w-8 p-0"
                title="Solicitar técnico humano"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* File Attachments Display */}
        {attachedFiles.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-600 rounded-lg px-3 py-2 text-sm">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-4 w-4 p-0 hover:text-red-500"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <WelcomeScreen onStartChat={(prompt, context) => {
              if (prompt) {
                handleSendMessage(prompt);
              } else if (context) {
                setContextType(context);
              }
            }} />
          ) : (
            <MessageList
              messages={messages}
              loading={isLoading}
              streaming={isStreaming}
              onMessageUpdate={(id, content) => {
                // Handle message update
              }}
              onMessageDelete={(id) => {
                // Handle message delete
              }}
              onRegenerate={(id) => {
                // Handle regenerate
              }}
              onFeedback={(id, type) => {
                // Handle feedback
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            placeholder={`Escreva sua questão jurídica em ${contextType === 'legal' ? 'português' : 'sua linguagem preferida'}...`}
          />
        </div>
      </div>
    </div>
  )
}
