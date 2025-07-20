'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Square,
  Paperclip,
  Image,
  Mic,
  Plus,
  LogIn,
  X,
  FileText,
  Upload,
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
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
    const files = uploadedFiles
    const audio = audioBlob

    // Reset state
    setMessage('')
    setUploadedFiles([])
    setAudioBlob(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      // For now, we'll pass the content and handle multimodal in the future
      // TODO: Implement proper multimodal message sending
      if (content || files.length > 0 || audio) {
        let messageContent = content
        
        if (files.length > 0) {
          messageContent += `\n\n📎 ${files.length} ficheiro(s) anexado(s): ${files.map(f => f.name).join(', ')}`
        }
        
        if (audio) {
          messageContent += '\n\n🎤 Áudio gravado anexado'
        }
        
        await onSendMessage(messageContent)
      }
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

  // File upload handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValidType && isValidSize
    })
    
    if (validFiles.length < files.length) {
      console.warn('Alguns ficheiros foram rejeitados (tipo ou tamanho inválido)')
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileRemove = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Voice recording handlers
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const canSend = (message.trim() || uploadedFiles.length > 0 || audioBlob) && !isLoading

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
            <div className="flex items-center space-x-2 mb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.jpeg,.jpg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Paperclip className="h-4 w-4" />
                <span>Documento</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Image className="h-4 w-4" />
                <span>Imagem</span>
              </Button>
            </div>

            {/* Uploaded files display */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Ficheiros anexados:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Audio recording display */}
            {audioBlob && (
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Áudio gravado</span>
                    <audio
                      controls
                      src={URL.createObjectURL(audioBlob)}
                      className="h-8"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioBlob(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
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
              onClick={handleVoiceToggle}
              className={cn(
                "p-2 transition-colors",
                isRecording 
                  ? "text-red-500 hover:text-red-600 bg-red-50" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Mic className="h-5 w-5" />
              {isRecording && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              )}
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
            {isRecording && <span className="text-red-500">🔴 Gravando áudio...</span>}
            {uploadedFiles.length > 0 && (
              <span className="text-blue-600">
                📎 {uploadedFiles.length} ficheiro(s)
              </span>
            )}
            {audioBlob && (
              <span className="text-green-600">🎤 Áudio pronto</span>
            )}
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