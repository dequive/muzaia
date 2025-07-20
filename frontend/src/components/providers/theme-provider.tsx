import * as React from "react"
import { useEffect, useRef, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loading, MessageSkeleton } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  MoreVertical,
  Edit,
  Trash2,
  Bot,
  User
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { useVirtualization } from "@/hooks/useVirtualization"
import type { Message, MessageRole, ModelResponse } from "@/types"

interface MessageListProps {
  /**
   * Lista de mensagens
   */
  messages: Message[]
  /**
   * Se true, mostra loading
   */
  loading?: boolean
  /**
   * Se true, está fazendo streaming
   */
  streaming?: boolean
  /**
   * Mensagem sendo transmitida em tempo real
   */
  streamingMessage?: string
  /**
   * ID da conversa atual
   */
  conversationId?: string
  /**
   * Callback para atualizar mensagem
   */
  onMessageUpdate?: (id: string, content: string) => void
  /**
   * Callback para deletar mensagem
   */
  onMessageDelete?: (id: string) => void
  /**
   * Callback para regenerar resposta
   */
  onRegenerate?: (messageId: string) => void
  /**
   * Callback para feedback
   */
  onFeedback?: (messageId: string, type: 'up' | 'down') => void
  /**
   * Se true, auto-scroll para nova mensagem
   */
  autoScroll?: boolean
  /**
   * Classes CSS adicionais
   */
  className?: string
}

interface MessageItemProps {
  message: Message
  onUpdate?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  onRegenerate?: (id: string) => void
  onFeedback?: (id: string, type: 'up' | 'down') => void
  isLast?: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onUpdate,
  onDelete,
  onRegenerate,
  onFeedback,
  isLast = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showDetails, setShowDetails] = useState(false)

  const handleEdit = () => {
    if (isEditing && editContent !== message.content) {
      onUpdate?.(message.id, editContent)
    }
    setIsEditing(!isEditing)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  return (
    <div className={cn(
      "group relative flex gap-3 py-4 px-4 hover:bg-muted/50 transition-colors",
      isLast && "border-b border-border"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={isUser ? message.user?.avatar_url : undefined} 
            alt={isUser ? message.user?.name : "Assistente"}
          />
          <AvatarFallback>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : isSystem ? (
              "SYS"
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">
            {isUser ? message.user?.name || "Você" : 
             isSystem ? "Sistema" : "Assistente"}
          </span>
          
          {/* Timestamp */}
          <span className="text-xs text-muted-foreground">
            {formatDate(message.created_at, { includeTime: true })}
          </span>

          {/* Badges de metadados */}
          {isAssistant && message.metadata?.model_responses && (
            <div className="flex gap-1">
              {message.metadata.model_responses.map((response: ModelResponse, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {response.model}
                </Badge>
              ))}
            </div>
          )}

          {/* Confidence Score */}
          {isAssistant && message.metadata?.confidence && (
            <Badge 
              variant={message.metadata.confidence > 0.8 ? 'success' : 
                       message.metadata.confidence > 0.6 ? 'warning' : 'destructive'}
              size="sm"
            >
              {Math.round(message.metadata.confidence * 100)}%
            </Badge>
          )}
        </div>

        {/* Conteúdo da mensagem */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[100px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>

        {/* Metadados expandidos */}
        {showDetails && isAssistant && message.metadata && (
          <div className="mt-3 p-3 bg-muted rounded-md text-xs space-y-2">
            {message.metadata.processing_time && (
              <div>Tempo: {message.metadata.processing_time}ms</div>
            )}
            {message.metadata.tokens_used && (
              <div>Tokens: {message.metadata.tokens_used}</div>
            )}
            {message.metadata.cost && (
              <div>Custo: ${message.metadata.cost.toFixed(4)}</div>
            )}
            {message.metadata.consensus_score && (
              <div>Consenso: {Math.round(message.metadata.consensus_score * 100)}%</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isLast && "opacity-100"
        )}>
          {/* Copy */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>

          {/* Feedback (apenas para assistente) */}
          {isAssistant && onFeedback && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(message.id, 'up')}
                className="h-6 px-2"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(message.id, 'down')}
                className="h-6 px-2"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </>
          )}

          {/* Regenerate (apenas para assistente) */}
          {isAssistant && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(message.id)}
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onUpdate && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-3 w-3 mr-2" />
                  {isEditing ? "Salvar" : "Editar"}
                </DropdownMenuItem>
              )}
              {isAssistant && (
                <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                  <Bot className="h-3 w-3 mr-2" />
                  {showDetails ? "Ocultar" : "Mostrar"} Detalhes
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Deletar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  streaming = false,
  streamingMessage = "",
  conversationId,
  onMessageUpdate,
  onMessageDelete,
  onRegenerate,
  onFeedback,
  autoScroll = true,
  className
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)

  // Auto-scroll para novas mensagens
  const scrollToBottom = useCallback(() => {
    if (autoScroll && !userScrolled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [autoScroll, userScrolled])

  // Scroll automático quando há novas mensagens
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, streamingMessage, scrollToBottom])

  // Detectar scroll manual do usuário
  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    setUserScrolled(!isNearBottom)
  }, [])

  // Renderizar mensagem de streaming
  const renderStreamingMessage = () => {
    if (!streaming || !streamingMessage) return null

    return (
      <div className="flex gap-3 py-4 px-4 bg-primary/5">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Assistente</span>
            <Loading variant="dots" size="sm" />
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap break-words">
              {streamingMessage}
              <span className="animate-pulse">▋</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && messages.length === 0) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <MessageSkeleton key={index} isUser={index % 2 === 0} />
        ))}
      </div>
    )
  }

  return (
    <div 
      ref={listRef}
      className={cn("flex-1 overflow-y-auto", className)}
      onScroll={handleScroll}
    >
      {messages.length === 0 && !streaming ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie uma conversa!</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              onUpdate={onMessageUpdate}
              onDelete={onMessageDelete}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
              isLast={index === messages.length - 1}
            />
          ))}
          
          {renderStreamingMessage()}
          
          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Scroll to bottom button */}
      {userScrolled && (
        <div className="fixed bottom-20 right-6 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUserScrolled(false)
              scrollToBottom()
            }}
            className="rounded-full shadow-lg"
          >
            ↓ Nova mensagem
          </Button>
        </div>
      )}
    </div>
  )
}

export { MessageList, MessageItem }
export type { MessageListProps, MessageItemProps }
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
