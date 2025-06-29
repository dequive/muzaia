// Message input component with rich features
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Settings,
  Smile,
  Image,
  File,
  Zap,
  Brain,
  Target,
  Scale,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useChatStore } from '@/store'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import type { ContextType } from '@/types'

const contextOptions = [
  { value: 'general', label: 'Geral', icon: Brain, color: 'bg-blue-500' },
  { value: 'technical', label: 'Técnico', icon: Zap, color: 'bg-green-500' },
  { value: 'legal', label: 'Jurídico', icon: Scale, color: 'bg-purple-500' },
  { value: 'business', label: 'Negócios', icon: Briefcase, color: 'bg-orange-500' },
  { value: 'academic', label: 'Acadêmico', icon: GraduationCap, color: 'bg-indigo-500' },
]

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
  placeholder = "Digite sua mensagem...",
}: MessageInputProps) {
  const { chatSettings, updateChatSettings } = useChatStore()
  const [message, setMessage] = useState('')
  const [selectedContext, setSelectedContext] = useState<ContextType>(chatSettings.default_context)
  const [isRecording, setIsRecording] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
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

    await onSendMessage(content, selectedContext)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line
        return
      } else if (e.metaKey || e.ctrlKey) {
        // Send with Cmd/Ctrl + Enter
        e.preventDefault()
        handleSend()
      } else {
        // Send with Enter
        e.preventDefault()
        handleSend()
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice recording
    console.log('Voice recording:', !isRecording)
  }

  const canSend = message.trim().length > 0 && !isLoading
  const selectedContextOption = contextOptions.find(opt => opt.value === selectedContext)

  return (
    <div className="p-4 space-y-3">
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="pr-1 max-w-[200px]"
              >
                <span className="truncate mr-1">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Context and Settings Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Context Selector */}
              <Select value={selectedContext} onValueChange={(value: ContextType) => setSelectedContext(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      {selectedContextOption && (
                        <>
                          <div className={cn("w-2 h-2 rounded-full", selectedContextOption.color)} />
                          <span className="text-sm">{selectedContextOption.label}</span>
                        </>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contextOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(showAdvanced && "text-primary")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Anexar arquivo</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceToggle}
                      className={cn(isRecording && "text-red-500")}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? 'Parar gravação' : 'Gravar áudio'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Advanced Settings Panel */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-3 space-y-3"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block mb-1 text-muted-foreground">Temperatura</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={chatSettings.generation_params.temperature}
                      onChange={(e) => updateChatSettings({
                        generation_params: {
                          ...chatSettings.generation_params,
                          temperature: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground">
                      {chatSettings.generation_params.temperature}
                    </span>
                  </div>
                  <div>
                    <label className="block mb-1 text-muted-foreground">Max Tokens</label>
                    <input
                      type="number"
                      min="100"
                      max="4000"
                      value={chatSettings.generation_params.max_tokens}
                      onChange={(e) => updateChatSettings({
                        generation_params: {
                          ...chatSettings.generation_params,
                          max_tokens: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-2 py-1 rounded border text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "min-h-[60px] max-h-[200px] pr-12 resize-none",
                "focus:ring-2 focus:ring-primary focus:border-transparent"
              )}
            />

            {/* Send/Stop Button */}
            <div className="absolute bottom-2 right-2">
              {isStreaming ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onStopStreaming}
                  className="h-8 w-8 p-0"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                {chatSettings.enable_streaming ? 'Streaming ativo' : 'Streaming desabilitado'}
              </span>
              {message.length > 0 && (
                <span>
                  {message.length} caracteres
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd>
              <span>enviar</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⇧ Enter</kbd>
              <span>nova linha</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".txt,.md,.pdf,.jpg,.jpeg,.png,.webp"
      />
    </div>
  )
}
