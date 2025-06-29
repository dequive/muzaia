// Message list component with streaming support
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message } from './message'
import { TypingIndicator } from './typing-indicator'
import { StreamingMessage } from './streaming-message'
import { RegenerateButton } from './regenerate-button'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store'
import type { Message as MessageType } from '@/types'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: MessageType[]
  isLoading: boolean
  isStreaming: boolean
  onRegenerateResponse: () => void
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  onRegenerateResponse,
}: MessageListProps) {
  const { streamingMessage } = useChat()
  const { chatSettings } = useChatStore()
  const [visibleMessages, setVisibleMessages] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // Animate messages as they appear
  useEffect(() => {
    const timer = setTimeout(() => {
      messages.forEach((message, index) => {
        setTimeout(() => {
          setVisibleMessages(prev => 
            prev.includes(message.id) ? prev : [...prev, message.id]
          )
        }, index * 100)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [messages])

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {} as Record<string, MessageType[]>)

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (dateString === today) return 'Hoje'
    if (dateString === yesterday) return 'Ontem'
    
    return date.toLocaleDateString('pt-MZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getLastAssistantMessage = () => {
    return messages
      .filter(m => m.role === 'assistant')
      .pop()
  }

  const lastAssistantMessage = getLastAssistantMessage()
  const canRegenerate = lastAssistantMessage && !isLoading && !isStreaming

  return (
    <div ref={listRef} className="space-y-6 max-w-4xl mx-auto">
      {Object.entries(groupedMessages).map(([dateGroup, dayMessages]) => (
        <div key={dateGroup} className="space-y-4">
          {/* Date Separator */}
          <div className="flex items-center justify-center py-2">
            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
              {formatDateGroup(dateGroup)}
            </div>
          </div>

          {/* Messages for this date */}
          <AnimatePresence mode="popLayout">
            {dayMessages.map((message, index) => {
              const isVisible = visibleMessages.includes(message.id)
              const isLastInGroup = index === dayMessages.length - 1
              const nextMessage = dayMessages[index + 1]
              const showAvatar = !nextMessage || nextMessage.role !== message.role
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={isVisible ? { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1 
                  } : {
                    opacity: 0, 
                    y: 20, 
                    scale: 0.95 
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: isVisible ? 0 : index * 0.1
                  }}
                  className={cn(
                    "group relative",
                    message.role === 'user' ? 'ml-auto' : 'mr-auto'
                  )}
                >
                  <Message
                    message={message}
                    showAvatar={showAvatar}
                    showModelResponses={chatSettings.show_model_responses}
                    showConfidenceScores={chatSettings.show_confidence_scores}
                  />
                  
                  {/* Regenerate button for last assistant message */}
                  {canRegenerate && 
                   message.id === lastAssistantMessage?.id && 
                   isLastInGroup && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex justify-start"
                    >
                      <RegenerateButton onClick={onRegenerateResponse} />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ))}

      {/* Streaming Message */}
      <AnimatePresence>
        {isStreaming && streamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mr-auto"
          >
            <StreamingMessage content={streamingMessage} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isLoading && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mr-auto"
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
