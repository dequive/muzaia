// Main chat interface component
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { ChatSettings } from './chat-settings'
import { EmptyState } from './empty-state'
import { WelcomeScreen } from './welcome-screen'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store'
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

  // Render different states
  if (!currentConversation && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col space-y-6 p-6">
        {/* Integration Test Section */}
        <div className="bg-muted/30 rounded-lg p-6">
          <IntegrationTest />
        </div>
        
        <WelcomeScreen onStartChat={handleNewChat} />
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
          placeholder="Como posso ajudá-lo hoje?"
        />
        
        {/* Chat Settings Sidebar */}
        <AnimatePresence>
          {ui.chat_settings_open && <ChatSettings />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6"
      >
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

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 z-10 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur">
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
          placeholder={
            currentConversation
              ? "Digite sua mensagem..."
              : "Como posso ajudá-lo hoje?"
          }
        />
      </div>

      {/* Chat Settings Sidebar */}
      <AnimatePresence>
        {ui.chat_settings_open && <ChatSettings />}
      </AnimatePresence>
    </div>
  )
}
