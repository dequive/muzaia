// Empty state component for conversations
'use client'

import { motion } from 'framer-motion'
import {
  MessageSquare,
  Brain,
  Zap,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ContextType } from '@/types'

const contextSuggestions = {
  general: [
    'Explique-me como funciona a inteligência artificial',
    'Quais são as tendências tecnológicas para 2024?',
    'Como posso melhorar minha produtividade no trabalho?',
  ],
  technical: [
    'Como implementar autenticação JWT em uma API?',
    'Qual a diferença entre SQL e NoSQL?',
    'Explique os princípios SOLID na programação',
  ],
  legal: [
    'Quais os direitos do consumidor em Moçambique?',
    'Como funciona o processo de abertura de empresa?',
    'Explique as leis trabalhistas para freelancers',
  ],
  business: [
    'Como criar um plano de negócios efetivo?',
    'Estratégias de marketing digital para PMEs',
    'Como calcular o ROI de um investimento?',
  ],
  academic: [
    'Explique a teoria da relatividade de Einstein',
    'Quais os impactos da globalização na economia?',
    'Como funciona o processo de fotossíntese?',
  ],
}

interface EmptyStateProps {
  onStartChat: (prompt?: string) => void
  conversationContext?: ContextType
}

export function EmptyState({ onStartChat, conversationContext = 'general' }: EmptyStateProps) {
  const suggestions = contextSuggestions[conversationContext] || contextSuggestions.general

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Icon and Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full" />
            <div className="absolute inset-2 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="h-3 w-3 text-white" />
            </motion.div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-2">
            Comece uma conversa
          </h2>
          <p className="text-muted-foreground">
            Faça uma pergunta ou escolha uma das sugestões abaixo para começar
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <div className="text-center p-4">
            <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium text-sm">Múltiplos LLMs</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Consenso entre vários modelos
            </p>
          </div>
          <div className="text-center p-4">
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium text-sm">Respostas Rápidas</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Streaming em tempo real
            </p>
          </div>
          <div className="text-center p-4">
            <Target className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium text-sm">Alta Precisão</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Respostas confiáveis e precisas
            </p>
          </div>
        </motion.div>

        {/* Suggested Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-medium flex items-center justify-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Sugestões para {conversationContext}
          </h3>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card 
                  className="cursor-pointer group hover:shadow-md transition-all duration-200"
                  onClick={() => onStartChat(suggestion)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-left group-hover:text-primary transition-colors">
                        {suggestion}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Ou digite sua pergunta na caixa de mensagem abaixo
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              Suporte a markdown
            </span>
            <span>•</span>
            <span>Streaming em tempo real</span>
            <span>•</span>
            <span>Múltiplos contextos</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
