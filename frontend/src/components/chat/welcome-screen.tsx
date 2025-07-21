
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/store'
import { MessageCircle, Upload, Mic, FileText, BookOpen, Gavel } from 'lucide-react'

interface WelcomeScreenProps {
  onStartChat: (prompt?: string, context?: string) => void
}

const quickPrompts = [
  {
    title: 'Análise de Contrato',
    description: 'Analisar cláusulas e identificar riscos',
    prompt: 'Preciso de ajuda para analisar um contrato. Pode me ajudar a identificar pontos importantes?',
    context: 'contract_analysis',
    icon: FileText
  },
  {
    title: 'Pesquisa Jurídica',
    description: 'Encontrar jurisprudência e legislação',
    prompt: 'Estou pesquisando sobre um tema jurídico específico. Pode me ajudar a encontrar referências relevantes?',
    context: 'legal_research',
    icon: BookOpen
  },
  {
    title: 'Consultoria Legal',
    description: 'Orientação sobre questões jurídicas',
    prompt: 'Tenho uma dúvida jurídica e preciso de orientação. Pode me explicar os aspectos legais envolvidos?',
    context: 'legal_consultation',
    icon: Gavel
  },
  {
    title: 'Redação Jurídica',
    description: 'Criar ou revisar documentos legais',
    prompt: 'Preciso redigir um documento jurídico. Pode me ajudar com a estrutura e conteúdo?',
    context: 'legal_drafting',
    icon: MessageCircle
  }
]

export function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
  const { chatSettings } = useChatStore()

  const handlePromptClick = (prompt: string, context?: string) => {
    onStartChat(prompt, context)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Mozaia Legal AI</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seu assistente jurídico inteligente com capacidades multimodais. 
            Analise documentos, pesquise legislação e obtenha orientação legal especializada.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Upload de Documentos
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Comando de Voz
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Chat Inteligente
            </Badge>
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {quickPrompts.map((prompt, index) => {
            const IconComponent = prompt.icon
            return (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handlePromptClick(prompt.prompt, prompt.context)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-left text-base">{prompt.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground text-left">
                    {prompt.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Features */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Capacidades Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-sm">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium">Análise de Documentos</h4>
              <p className="text-muted-foreground">
                Processe contratos, petições e outros documentos legais com precisão
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium">Pesquisa Jurídica</h4>
              <p className="text-muted-foreground">
                Acesso a jurisprudência, legislação e doutrina atualizada
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-medium">Assistência Inteligente</h4>
              <p className="text-muted-foreground">
                Orientação especializada com suporte a múltiplos formatos
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="space-y-4">
          <Button 
            size="lg" 
            onClick={() => onStartChat()}
            className="px-8 py-3 text-base"
          >
            Iniciar Nova Conversa
          </Button>
          <p className="text-xs text-muted-foreground">
            Powered by {chatSettings.selectedModel || 'Multiple AI Models'} • 
            Secure & Private • LGPD Compliant
          </p>
        </div>
      </div>
    </div>
  )
}
