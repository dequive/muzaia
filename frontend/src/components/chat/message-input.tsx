'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Square,
  Paperclip,
  Image,
  Mic,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ContextType } from '@/types'

interface MessageInputProps {
  onSendMessage: (content: string, context?: ContextType) => Promise<void>
  isLoading: boolean
  isStreaming: boolean
  onStopStreaming: () => void
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  isLoading,
  isStreaming,
  onStopStreaming,
  placeholder = "Envie uma mensagem...",
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const content = message.trim()
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = message.trim().length > 0 && !isLoading

  return (
    <div className="relative">
      {/* Attachment Options */}
      {showAttachments && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full left-0 mb-2 flex space-x-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-800 shadow-lg"
            onClick={() => setShowAttachments(false)}
          >
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-800 shadow-lg"
            onClick={() => setShowAttachments(false)}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Arquivo
          </Button>
        </motion.div>
      )}

      {/* Main Input Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-md transition-all duration-200">
        <div className="flex items-end p-3 space-x-3">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachments(!showAttachments)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 self-end mb-1"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Message Input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "min-h-[20px] max-h-[200px] resize-none border-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent focus:ring-0 focus:outline-none",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              )}
              rows={1}
            />
          </div>

          {/* Voice/Send Button */}
          <div className="flex items-center space-x-2 self-end mb-1">
            {!canSend && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}

            {isStreaming ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={onStopStreaming}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <Square className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                  canSend 
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}