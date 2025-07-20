// Progress bar for navigation
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ProgressBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {isLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary transition-all duration-500 ease-in-out"
          style={{ width: '100%' }}
        />
      )}
    </>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao Mozaia AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Orquestrador de LLMs com consenso inteligente
        </p>
        <div className="space-x-4">
          <a
            href="/chat"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Chat
          </a>
          <a
            href="/admin"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Administração
          </a>
        </div>
      </div>
    </div>
  )
}
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
