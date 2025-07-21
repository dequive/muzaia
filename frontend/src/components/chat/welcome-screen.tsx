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
  FileText,
  Upload,
  Mic,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ContextType } from '@/types'

const contextSuggestions = {
  legal: [
    'Como posso abrir uma empresa em Moçambique?',
    'Quais são os direitos do consumidor?',
    'Explique-me o processo de divórcio consensual',
    'Que documentos preciso para um contrato de trabalho?',
  ],
  business: [
    'Como criar um plano de negócios efetivo?',
    'Estratégias de marketing para pequenas empresas',
    'Como calcular o ROI de um investimento?',
    'Que licenças preciso para exportar produtos?',
  ],
  technical: [
    'Como implementar autenticação JWT?',
    'Diferenças entre SQL e NoSQL',
    'Princípios SOLID na programação',
    'Como configurar um servidor web seguro?',
  ],
  general: [
    'Explique-me como funciona a inteligência artificial',
    'Tendências tecnológicas para 2024',
    'Como melhorar produtividade no trabalho',
    'Conceitos básicos de cibersegurança',
  ],
}

const contextIcons = {
  legal: Scale,
  business: Briefcase,
  technical: Code,
  general: Brain,
}

const contextColors = {
  legal: 'from-blue-500 to-cyan-600',
  business: 'from-emerald-500 to-teal-600',
  technical: 'from-purple-500 to-indigo-600',
  general: 'from-orange-500 to-red-600',
}

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
    context: 'general' as ContextType,
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
  const handlePromptClick = (prompt: string, context: ContextType) => {
    onStartChat(prompt, context)
  }

  return (
    <div className="flex-1 overflow-y-auto">
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
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Bem-vindo ao <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">Mozaia AI</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Seu assistente de IA jurídico inteligente com suporte a documentos, voz e contexto especializado
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Upload de Documentos</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mic className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Comandos de Voz</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Chat Inteligente</span>
            </div>
          </div>
        </motion.div>

        {/* Context Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {Object.entries(contextSuggestions).map(([context, suggestions], index) => {
            const Icon = contextIcons[context as ContextType]
            return (
              <motion.div
                key={context}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${contextColors[context as ContextType]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold capitalize mb-2">{context}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestions.length} sugestões disponíveis
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Start Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2 flex items-center justify-center">
              <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
              Como posso ajudar hoje?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha uma categoria ou digite sua pergunta diretamente
            </p>
          </div>

          {Object.entries(contextSuggestions).map(([context, suggestions]) => (
            <div key={context} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="capitalize">
                  {context}
                </Badge>
              </div>

              <div className="grid gap-2">
                {suggestions.slice(0, 2).map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <Card 
                      className="cursor-pointer group hover:shadow-md hover:border-emerald-200 transition-all duration-200"
                      onClick={() => handlePromptClick(suggestion, context as ContextType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-left group-hover:text-emerald-600 transition-colors flex-1">
                            {suggestion}
                          </p>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg p-6">
            <h4 className="font-semibold mb-2">Dica:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Você pode fazer upload de documentos (PDF, DOCX, TXT), usar comandos de voz, ou simplesmente digitar sua pergunta.
              O Mozaia AI vai analisar o contexto e fornecer respostas especializadas.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}