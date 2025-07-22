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
  Sparkles,
  Plus,
  MoreHorizontal,
  MessageSquare,
  Zap,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {[
        "Explique o direito de propriedade em Moçambique",
        "Como funciona o processo de divórcio?",
        "Quais são os direitos trabalhistas básicos?",
        "Explique a constituição moçambicana"
      ].map((prompt, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
            onClick={() => setInput(prompt)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">{prompt}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Assistente IA</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Especializado em Direito Moçambicano</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
              Online
            </Badge>
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearMessages}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            )}
          </div>
        </div>
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
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Como posso ajudar você hoje?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Sou especializado em direito moçambicano e posso ajudar com questões legais, análise de documentos e orientação jurídica.
              </p>
              <ExamplePrompts />
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message: Message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`px-6 py-4 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {message.role === 'assistant' && (
                      <div className="flex items-center mt-2 space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 order-3">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {(isLoading || isTyping) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Analisando sua pergunta...</span>
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

      {/* Input Area */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta jurídica aqui... (Shift + Enter para nova linha)"
              disabled={isLoading}
              className="min-h-[60px] max-h-[200px] resize-none pr-16 rounded-2xl border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800"
              rows={1}
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {input.length}/2000
              </Badge>
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
            <p>O Mozaia pode cometer erros. Considere verificar informações importantes.</p>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Enter</kbd>
              <span>para enviar</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}