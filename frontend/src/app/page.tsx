
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Muzaia - AI Chat Platform',
  description: 'AI Chat Platform with Multi-LLM Support and intelligent consensus',
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao Muzaia
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Plataforma de IA com suporte a múltiplos LLMs e consenso inteligente
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
