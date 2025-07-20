import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mozaia AI - Orquestrador de LLMs',
  description: 'Plataforma de IA com suporte a múltiplos LLMs e consenso inteligente',
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-4xl font-bold mb-4">
          Bem-vindo ao Mozaia AI
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Orquestrador de LLMs com consenso inteligente para Moçambique
        </p>
        <div className="flex gap-4">
          <a 
            href="/chat" 
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Começar Chat
          </a>
          <a 
            href="/login" 
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Fazer Login
          </a>
        </div>
      </div>
    </div>
  )
}