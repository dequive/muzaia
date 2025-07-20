
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mozaia AI - Orquestrador de LLMs',
  description: 'Plataforma de IA com suporte a múltiplos LLMs e consenso inteligente',
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao Mozaia AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Orquestrador de LLMs com consenso inteligente para Moçambique
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
