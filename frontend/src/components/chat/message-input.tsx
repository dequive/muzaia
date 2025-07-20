'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Square,
  Paperclip,
  Mic,
  LogIn,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
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
    if (!canSend) return

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

  const handleVoiceToggle = useCallback(() => {
  }, [])

  const canSend = message.trim() && !isLoading

  return (
    <div className="p-4">
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <LogIn className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Login necessário
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Para usar o chat, você precisa fazer login primeiro.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleLoginRedirect}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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

      {/* Main input container */}
      <div className="relative max-w-4xl mx-auto">
        <div className="relative flex items-end bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-lg overflow-hidden">
          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva a sua mensagem..."
              disabled={isLoading}
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent focus:ring-0 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 p-2">
            {/* Attachment button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Anexar ficheiro"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Voice button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 transition-colors",
                isRecording 
                  ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
              title="Gravação de voz"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send/Stop button */}
            <Button
              onClick={isStreaming ? onStopStreaming : handleSend}
              disabled={!canSend && !isStreaming}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                isStreaming 
                  ? "bg-red-600 hover:bg-red-700" 
                  : canSend 
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg" 
                    : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
              )}
              title="Enviar mensagem"
            >
              {isStreaming ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex justify-between items-center mt-3 px-1">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            {!user && (
              <span className="text-emerald-600 dark:text-emerald-400">
                💡 Experimente gratuitamente ou faça login para mais recursos
              </span>
            )}
            {isLoading && <span>Enviando mensagem...</span>}
            {isStreaming && <span>Gerando resposta...</span>}
            {isRecording && <span className="text-red-500">🔴 Gravando áudio...</span>}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500">
            {message.length > 0 && (
              <span className={message.length > 2000 ? 'text-red-500' : ''}>
                {message.length}/2000
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}