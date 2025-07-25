# Analyze the code changes and generate the complete modified code.
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Edit3,
  Sparkles
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mt-12">
      {[
        {
          title: "Direito de Propriedade",
          prompt: "Explique o direito de propriedade em Moçambique",
          icon: "🏠"
        },
        {
          title: "Processo de Divórcio", 
          prompt: "Como funciona o processo de divórcio em Moçambique?",
          icon: "⚖️"
        },
        {
          title: "Direitos Trabalhistas",
          prompt: "Quais são os direitos trabalhistas básicos?",
          icon: "💼"
        },
        {
          title: "Constituição",
          prompt: "Explique os principais artigos da constituição moçambicana",
          icon: "📜"
        }
      ].map((item, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => setInput(item.prompt)}
          className="group text-left p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-start space-x-4">
            <div className="text-2xl">{item.icon}</div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.prompt}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header - Claude Style */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Muzaia</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assistente jurídico especializado</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearMessages}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova conversa
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-8"
      >
        <div className="space-y-8 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 max-w-3xl mx-auto"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
                Como posso te ajudar hoje?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
                Sou seu assistente jurídico especializado em direito moçambicano. 
                Posso ajudar com questões legais, processos e interpretação de leis.
              </p>
              <ExamplePrompts />
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message: Message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="group"
                >
                  <div className="flex gap-6 py-8 px-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 -mx-6 rounded-2xl transition-all duration-300">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === 'assistant' ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {message.role === 'assistant' ? 'Muzaia' : 'Você'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date().toLocaleTimeString('pt-PT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>

                      <div className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                        <div className="whitespace-pre-wrap font-normal text-base">
                          {message.content}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Útil
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Refazer
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <div className="flex gap-6 py-8 px-6 -mx-6">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Muzaia</div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pensando...</span>
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
            className="mx-8 mb-4"
          >
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - Claude Style */}
      <div className="p-8 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem para Muzaia..."
                disabled={isLoading}
                className="min-h-[60px] w-full resize-none rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 pr-14 text-base placeholder:text-gray-400 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-0 shadow-lg focus:shadow-xl transition-all duration-300"
                rows={1}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-3 bottom-3 h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Muzaia pode cometer erros. Considere verificar informações importantes sobre questões legais.
          </div>
        </div>
      </div>
    </div>
  )
}
```

```tool_code
# Analyze the code changes and generate the complete modified code.
The code changes aim to update the chat interface with a modern design similar to Claude AI. This involves changes to the imports, the main component's structure, styling, and functionality.