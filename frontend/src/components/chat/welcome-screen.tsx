// Welcome screen component
'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  Zap,
  Target,
  Lightbulb,
  Code,
  Scale,
  Briefcase,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/store'
import type { ContextType } from '@/types'

const suggestedPrompts = [
  {
    context: 'general' as ContextType,
    icon: Lightbulb,
    title: 'Brainstorming de ideias',
    prompt: 'Preciso de ideias criativas para um projeto de sustentabilidade em Moçambique',
    description: 'Gere ideias inovadoras e criativas',
  },
  {
    context: 'technical' as ContextType,
    icon: Code,
    title: 'Código e programação',
    prompt: 'Como implementar autenticação JWT em Node.js com TypeScript?',
    description: 'Soluções técnicas e código',
  },
  {
    context: 'legal' as ContextType,
    icon: Scale,
    title: 'Questões jurídicas',
    prompt: 'Quais são os requisitos legais para abrir uma startup em Moçambique?',
    description: 'Consultas sobre legislação',
  },
  {
    context: 'business' as ContextType,
    icon: Briefcase,
    title: 'Estratégia de negócios',
    prompt: 'Elabore um plano de marketing digital para uma empresa local',
    description: 'Insights de negócios e estratégia',
  },
  {
    context: 'academic' as ContextType,
    icon: GraduationCap,
    title: 'Pesquisa acadêmica',
    prompt: 'Explique os impactos das mudanças climáticas na agricultura moçambicana',
    description: 'Conteúdo educacional e pesquisa',
  },
]

const features = [
  {
    icon: Brain,
    title: 'Consenso Inteligente',
    description: 'Múltiplos modelos LLM trabalhando juntos para respostas mais precisas',
  },
  {
    icon: Zap,
    title: 'Respostas Rápidas',
    description: 'Streaming em tempo real com processamento otimizado',
  },
  {
    icon: Target,
    title: 'Contextualizado',
    description: 'Respostas adaptadas ao contexto local de Moçambique',
  },
]

interface WelcomeScreenProps {
  onStartChat: (prompt?: string, context?: ContextType) => void
}

export function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
  const { chatSettings } = useChatStore()

  const handlePromptClick = (prompt: string, context: ContextType) => {
    onStartChat(prompt, context)
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Bem-vindo ao <span className="text-gradient">Mozaia</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Seu assistente de IA júridico inteligente.
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              <span>Sistema operacional</span>
            </div>
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              <span>Contextualizado para Moçambique</span>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <Card key={feature.title} className="text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Suggested Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-center mb-8">
            Comece com um exemplo
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedPrompts.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card 
                  className="cursor-pointer group hover:shadow-lg transition-all duration-200 h-full"
                  onClick={() => handlePromptClick(item.prompt, item.context)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.prompt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {item.context}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Ou comece digitando sua pergunta na caixa de mensagem abaixo
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <span>⌘ + Enter para enviar rápido</span>
            <span>•</span>
            <span>Suporte a markdown</span>
            <span>•</span>
            <span>Streaming em tempo real</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
