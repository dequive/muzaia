'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  Plus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit3
} from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { Message } from '@/types'

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages 
  } = useChat()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsTyping(true)
    await sendMessage(input)
    setInput('')
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const ExamplePrompts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto mt-8">
      {[
        "Explique o direito de propriedade em Moçambique",
        "Como funciona o processo de divórcio?",
        "Quais são os direitos trabalhistas básicos?", 
        "Explique a constituição moçambicana"
      ].map((prompt, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => setInput(prompt)}
          className="text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{prompt}</p>
        </motion.button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Claude Style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-lg font-medium text-slate-900 dark:text-slate-100">Mozaia</h1>
          </div>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearMessages}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova conversa
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-6"
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 max-w-2xl mx-auto"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-8">
                <div className="w-6 h-6 bg-orange-500 rounded"></div>
              </div>
              <h3 className="text-3xl font-normal text-slate-900 dark:text-slate-100 mb-6">
                Como posso ajudar você hoje?
              </h3>
              <ExamplePrompts />
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message: Message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <div className="flex gap-4 py-6 px-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 -mx-4 rounded-lg transition-colors">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === 'assistant' ? (
                        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {message.role === 'assistant' ? 'Mozaia' : 'Você'}
                      </div>
                      <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                        <p className="whitespace-pre-wrap m-0">{message.content}</p>
                      </div>

                      {/* Action buttons */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {(isLoading || isTyping) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <div className="flex gap-4 py-6 px-4 -mx-4">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Mozaia</div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mb-4"
          >
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - Claude Style */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem para Mozaia..."
                disabled={isLoading}
                className="min-h-[52px] w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:border-orange-300 dark:focus:border-orange-600 focus:outline-none focus:ring-0 shadow-sm"
                rows={1}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            Mozaia pode cometer erros. Considere verificar informações importantes.
          </div>
        </div>
      </div>
    </div>
  )
}