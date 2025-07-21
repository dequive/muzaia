'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, FileText, Calculator, Globe, Code, Zap } from 'lucide-react'
import { useChatStore } from '@/store'

const suggestedPrompts = [
    {
        title: "Análise Jurídica",
        description: "Analise contratos e documentos legais",
        prompt: "Preciso analisar este contrato e identificar possíveis cláusulas problemáticas",
        context: "legal",
        icon: FileText,
        category: "Jurídico"
    },
    {
        title: "Pesquisa Rápida",
        description: "Busque informações específicas",
        prompt: "Pesquise sobre as últimas mudanças na legislação trabalhista portuguesa",
        context: "research",
        icon: Globe,
        category: "Pesquisa"
    },
    {
        title: "Cálculos Complexos",
        description: "Resolva problemas matemáticos",
        prompt: "Calcule os juros compostos de um investimento de 10.000€ a 5% ao ano por 10 anos",
        context: "calculation",
        icon: Calculator,
        category: "Cálculo"
    },
    {
        title: "Programação",
        description: "Ajuda com código e desenvolvimento",
        prompt: "Crie uma função em Python para validar emails",
        context: "coding",
        icon: Code,
        category: "Tech"
    },
    {
        title: "Brainstorming",
        description: "Gere ideias criativas",
        prompt: "Sugira 10 ideias inovadoras para melhorar a produtividade no escritório",
        context: "creative",
        icon: Lightbulb,
        category: "Criativo"
    },
    {
        title: "Otimização",
        description: "Melhore processos existentes",
        prompt: "Como posso otimizar o fluxo de aprovação de documentos na minha empresa?",
        context: "optimization",
        icon: Zap,
        category: "Eficiência"
    }
]

interface WelcomeScreenProps {
    onStartChat: (prompt: string, context?: string) => void
}

export function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
    const { chatSettings } = useChatStore()

    const handlePromptClick = (prompt: string, context?: string) => {
        onStartChat(prompt, context)
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Bem-vindo ao Mozaia Chat
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Seu assistente inteligente para análises jurídicas, pesquisas e muito mais. 
                        Escolha uma das sugestões abaixo ou comece uma conversa personalizada.
                    </p>
                </div>

                {/* Model Info */}
                <div className="flex justify-center">
                    <Badge variant="secondary" className="px-3 py-1">
                        Modelo: {chatSettings.selectedModel || 'GPT-4'}
                    </Badge>
                </div>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestedPrompts.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <Card 
                                key={index}
                                className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50"
                                onClick={() => handlePromptClick(item.prompt, item.context)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">
                                                {item.title}
                                            </h3>
                                            <Badge variant="outline" className="text-xs">
                                                {item.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground italic">
                                            "{item.prompt.length > 80 ? item.prompt.substring(0, 80) + '...' : item.prompt}"
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Quick Start Tips */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="w-4 h-4" />
                        <span>Dica: Seja específico nas suas perguntas para obter melhores respostas</span>
                    </div>
                </div>
            </div>
        </div>
    )
}