
import React from 'react'
import { siteConfig } from "@/config/site"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              {siteConfig.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {siteConfig.description}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">Multi-LLM</h3>
              <p className="text-gray-600 text-sm">Orquestre múltiplos modelos de IA para obter as melhores respostas</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Consenso Inteligente</h3>
              <p className="text-gray-600 text-sm">Algoritmo avançado que combina respostas para máxima precisão</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-lg font-semibold mb-2">Para Moçambique</h3>
              <p className="text-gray-600 text-sm">Otimizado para contextos locais e necessidades específicas</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/chat"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="mr-2">🚀</span>
              Começar Chat
            </a>
            
            <a
              href="/docs"
              className="inline-flex items-center px-8 py-4 bg-white/80 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300"
            >
              <span className="mr-2">📚</span>
              Documentação
            </a>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-white/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">5+</div>
              <div className="text-sm text-gray-600">Modelos LLM</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-600 mb-1">99%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">< 2s</div>
              <div className="text-sm text-gray-600">Tempo Resposta</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-600 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Disponível</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
