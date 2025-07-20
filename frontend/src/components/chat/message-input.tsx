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
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()

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
    if (!message.trim()) return

    // Allow anonymous users to send messages in public mode

    const content = message.trim()
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await onSendMessage(content)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLoginRedirect = () => {
    window.location.href = '/login'
  }

  const canSend = message.trim() && !isLoading

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Login prompt modal */}
      {showLoginPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLoginPrompt(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <LogIn className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Login necessário
              </h3>
              <p className="text-gray-600 mb-6">
                Para usar o chat, você precisa fazer login primeiro.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleLoginRedirect}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Fazer Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Attachments panel */}
        {showAttachments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Image className="h-4 w-4" />
                <span>Imagem</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Paperclip className="h-4 w-4" />
                <span>Arquivo</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main input area */}
        <div className="relative">
          <div className="flex items-end space-x-2">
            {/* Attachment button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAttachments(!showAttachments)}
              className={cn(
                "p-2 text-gray-500 hover:text-gray-700",
                showAttachments && "text-blue-600"
              )}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Text input */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                className="min-h-[48px] max-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                rows={1}
              />
            </div>

            {/* Send/Stop button */}
            <Button
              onClick={isStreaming ? onStopStreaming : handleSend}
              disabled={!canSend && !isStreaming}
              size="sm"
              className={cn(
                "p-2 transition-colors",
                isStreaming 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              )}
            >
              {isStreaming ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* Voice input button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {!user && (
              <span className="text-blue-600">
                💡 Experimente gratuitamente ou faça login para mais recursos
              </span>
            )}
            {isLoading && <span>Enviando...</span>}
            {isStreaming && <span>Gerando resposta...</span>}
          </div>
          <div>
            {message.length > 0 && (
              <span className={message.length > 1000 ? 'text-red-500' : ''}>
                {message.length}/1000
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}