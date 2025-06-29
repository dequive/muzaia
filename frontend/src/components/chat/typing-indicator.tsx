// Typing indicator component
'use client'

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 flex items-center space-x-2"
      >
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-muted-foreground rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          Processando...
        </span>
      </motion.div>
    </div>
  )
}
