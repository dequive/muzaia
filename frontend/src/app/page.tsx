
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="text-center max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Bem-vindo ao {siteConfig.name}
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          {siteConfig.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Iniciar Chat
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
        
        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Consenso Inteligente</h3>
            <p className="text-gray-600">Múltiplos LLMs trabalhando em conjunto para respostas mais precisas</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Alta Disponibilidade</h3>
            <p className="text-gray-600">Sistema robusto com fallback automático entre modelos</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Para Moçambique</h3>
            <p className="text-gray-600">Desenvolvido especificamente para o contexto moçambicano</p>
          </div>
        </div>
      </div>
    </div>
  )
}
