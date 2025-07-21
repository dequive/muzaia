
'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Sparkles, 
  Brain, 
  Zap, 
  Target, 
  Shield,
  HelpCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/store'
import type { ContextType } from '@/types'

interface WelcomeScreenProps {
  onStartChat: (prompt?: string, context?: ContextType) => void
}

const quickStarters = [
  {
    title: "Questão Jurídica",
    description: "Tire dúvidas sobre leis e direitos",
    icon: Shield,
    context: "legal" as ContextType,
    prompts: [
      "Quais são os meus direitos como consumidor?",
      "Como funciona o processo de divórcio?",
      "Direitos trabalhistas em Moçambique"
    ]
  },
  {
    title: "Análise de Negócios", 
    description: "Estratégias e planejamento empresarial",
    icon: Target,
    context: "business" as ContextType,
    prompts: [
      "Como criar um plano de negócios?",
      "Estratégias de marketing digital",
      "Análise de viabilidade financeira"
    ]
  },
  {
    title: "Suporte Técnico",
    description: "Programação e tecnologia",
    icon: Zap,
    context: "technical" as ContextType,
    prompts: [
      "Como implementar autenticação JWT?",
      "Diferenças entre SQL e NoSQL",
      "Melhores práticas de segurança"
    ]
  },
  {
    title: "Consulta Geral",
    description: "Qualquer outra dúvida",
    icon: Brain,
    context: "general" as ContextType,
    prompts: [
      "Explique-me como funciona a IA",
      "Tendências tecnológicas 2024",
      "Como melhorar a produtividade"
    ]
  }
]

export function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
  const { chatSettings } = useChatStore()

  const handlePromptClick = (prompt: string, context?: ContextType) => {
    onStartChat(prompt, context)
  }

  const handleContextStart = (context: ContextType) => {
    onStartChat(undefined, context)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao Mozaia AI
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Seu assistente inteligente com consenso de múltiplos modelos de IA
          </p>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Múltiplos LLMs
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Consenso Inteligente
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Resposta Otimizada
            </Badge>
          </div>
        </div>

        {/* Quick Starters */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStarters.map((starter, index) => {
            const IconComponent = starter.icon
            return (
              <motion.div
                key={starter.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200 hover:border-emerald-300"
                      onClick={() => handleContextStart(starter.context)}>
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {starter.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {starter.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Sample Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Sugestões para começar
          </h2>
          
          <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {quickStarters.flatMap(starter => 
              starter.prompts.slice(0, 2).map((prompt, index) => (
                <Button
                  key={`${starter.context}-${index}`}
                  variant="ghost"
                  className="text-left justify-start h-auto p-4 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                  onClick={() => handlePromptClick(prompt, starter.context)}
                >
                  <div className="flex items-center space-x-3">
                    <starter.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {prompt}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>
              ))
            )}
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          <Button 
            size="lg" 
            onClick={() => onStartChat()}
            className="px-8 py-3 text-base bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Iniciar Nova Conversa
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by {chatSettings?.selectedModel || 'Multiple AI Models'} • 
            Secure & Private • LGPD Compliant
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
