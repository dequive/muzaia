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
            className="bg-white dark:bg-gray-800 shadow-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowAttachments(false)}
          >
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-800 shadow-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowAttachments(false)}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Arquivo
          </Button>
        </motion.div>
      )}

      {/* Main Input Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-300 dark:border-gray-600 shadow-lg focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:shadow-xl transition-all duration-200">
        <div className="flex items-end p-4 space-x-4">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachments(!showAttachments)}
            className="h-10 w-10 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full self-end"
          >
            <Plus className="h-5 w-5" />
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
                "min-h-[24px] max-h-[200px] resize-none border-0 p-0 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent focus:ring-0 focus:outline-none",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              )}
              rows={1}
            />
          </div>

          {/* Send/Stop Button */}
          <div className="flex items-center self-end">
            {isStreaming ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={onStopStreaming}
                className="h-10 w-10 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "h-10 w-10 p-0 rounded-full transition-all duration-200",
                  canSend 
                    ? "bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-md hover:shadow-lg" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}