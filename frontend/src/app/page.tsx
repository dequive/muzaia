
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mozaia AI - Orquestrador de LLMs',
  description: 'Orquestrador de LLMs com consenso inteligente para Moçambique',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Bem-vindo ao Mozaia AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Orquestrador de LLMs com consenso inteligente para Moçambique. 
          Experimente conversas avançadas com múltiplos modelos de linguagem.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Iniciar Chat
          </Link>
          <Link
            href="/login"
            className="inline-block border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
          >
            Fazer Login
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Múltiplos LLMs</h3>
            <p className="text-gray-600">Acesso a diversos modelos de linguagem em uma única interface</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Consenso Inteligente</h3>
            <p className="text-gray-600">Sistema avançado de consenso para respostas mais precisas</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Para Moçambique</h3>
            <p className="text-gray-600">Desenvolvido especificamente para o contexto moçambicano</p>
          </div>
        </div>
      </div>
    </div>
  )
}
