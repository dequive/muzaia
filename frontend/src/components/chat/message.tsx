// Individual message component
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Brain,
  User,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Share,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/useAuth'
import { copyToClipboard, formatRelativeTime, cn } from '@/lib/utils'
import type { Message as MessageType } from '@/types'

interface MessageProps {
  message: MessageType
  showAvatar?: boolean
  showModelResponses?: boolean
  showConfidenceScores?: boolean
}

export function Message({
  message,
  showAvatar = true,
  showModelResponses = false,
  showConfidenceScores = true,
}: MessageProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const hasMetadata = message.metadata && Object.keys(message.metadata).length > 0
  const confidence = message.metadata?.confidence || 0
  const consensusScore = message.metadata?.consensus_score || 0
  const modelResponses = message.metadata?.model_responses || []
  const processingTime = message.metadata?.processing_time || 0
  const tokensUsed = message.metadata?.tokens_used || 0
  const cost = message.metadata?.cost || 0

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type)
    // TODO: Send feedback to API
    console.log('Feedback:', type, 'for message:', message.id)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
    return 'text-red-600 bg-red-100 dark:bg-red-900'
  }

  const getConsensusColor = (score: number) => {
    if (score >= 0.8) return 'text-blue-600 bg-blue-100 dark:bg-blue-900'
    if (score >= 0.6) return 'text-purple-600 bg-purple-100 dark:bg-purple-900'
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
  }

  return (
    <div className={cn(
      "flex gap-4 py-6 px-4 group",
      isUser 
        ? "bg-gray-50 dark:bg-gray-700/50" 
        : "bg-white dark:bg-gray-800"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className={cn(
            "h-8 w-8",
            isUser 
              ? "bg-green-500" 
              : "bg-gray-100 dark:bg-gray-600"
          )}>
            {isUser ? (
              <AvatarFallback className="bg-green-500 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                <Brain className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "text-right" : "text-left"
      )}>
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-none">
          {/* Message Text */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isUser ? (
                <p className="whitespace-pre-wrap break-words m-0 text-gray-900 dark:text-white">
                  {message.content}
                </p>
              ) : (
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''
                    
                    return !inline && match ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          className="rounded-md !mt-2 !mb-2"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => copyToClipboard(String(children))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Actions for assistant messages */}
          {isAssistant && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('up')}
                  className={cn(
                    "h-6 w-6 p-0",
                    feedback === 'up' && "text-green-600"
                  )}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('down')}
                  className={cn(
                    "h-6 w-6 p-0",
                    feedback === 'down' && "text-red-600"
                  )}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Confidence and Consensus Scores */}
                {showConfidenceScores && (confidence > 0 || consensusScore > 0) && (
                  <div className="flex items-center space-x-1">
                    {confidence > 0 && (
                      <Badge variant="outline" className={cn("text-xs", getConfidenceColor(confidence))}>
                        <Target className="h-2 w-2 mr-1" />
                        {Math.round(confidence * 100)}%
                      </Badge>
                    )}
                    {consensusScore > 0 && (
                      <Badge variant="outline" className={cn("text-xs", getConsensusColor(consensusScore))}>
                        <TrendingUp className="h-2 w-2 mr-1" />
                        {Math.round(consensusScore * 100)}%
                      </Badge>
                    )}
                  </div>
                )}

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                      {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Salvar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </motion.div>

        {/* Metadata and Details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatRelativeTime(message.created_at)}
          </span>
          
          {isAssistant && processingTime > 0 && (
            <span className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              {processingTime.toFixed(2)}s
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {isAssistant && hasMetadata && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="mt-2">
                  <CardContent className="p-4 space-y-3">
                    {/* Processing Stats */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Tempo</div>
                        <div className="font-medium">{processingTime.toFixed(2)}s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tokens</div>
                        <div className="font-medium">{tokensUsed}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Custo</div>
                        <div className="font-medium">${cost.toFixed(4)}</div>
                      </div>
                    </div>

                    {/* Model Responses */}
                    {showModelResponses && modelResponses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Respostas dos Modelos</h4>
                        <div className="space-y-2">
                          {modelResponses.map((response, index) => (
                            <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">{response.model_name}</Badge>
                                <span className="text-muted-foreground">
                                  {Math.round(response.confidence * 100)}%
                                </span>
                              </div>
                              <p className="line-clamp-2">{response.response_text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
