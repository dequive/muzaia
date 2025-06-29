// Streaming message component
'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface StreamingMessageProps {
  content: string
  className?: string
}

export function StreamingMessage({ content, className }: StreamingMessageProps) {
  return (
    <div className={cn("flex gap-3 group", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block max-w-[80%] bg-muted rounded-2xl rounded-tl-md px-4 py-3 relative"
        >
          {/* Streaming indicator */}
          <div className="absolute -top-1 -left-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
          
          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>

          {/* Typing cursor */}
          <motion.span
            className="inline-block w-2 h-4 bg-primary ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>

        {/* Streaming status */}
        <div className="text-xs text-muted-foreground flex items-center">
          <motion.div
            className="flex space-x-1 mr-2"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-1 bg-primary rounded-full" />
            <div className="w-1 h-1 bg-primary rounded-full" />
            <div className="w-1 h-1 bg-primary rounded-full" />
          </motion.div>
          Mozaia está digitando...
        </div>
      </div>
    </div>
  )
}
