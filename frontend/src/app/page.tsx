
import React from 'react'
import Link from 'next/link'
import { MessageSquare, Sparkles, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Mozaia AI - Chat Público
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Experimente nosso orquestrador de LLMs com consenso inteligente.
            <br />
            <span className="text-sm text-gray-500">Nenhum login necessário!</span>
          </p>
          
          <div className="space-x-4 mb-12">
            <Link
              href="/chat"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Começar a Conversar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Entrar (Opcional)
            </Link>
          </div>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Múltiplos Modelos</h3>
              <p className="text-gray-600">Orquestração inteligente entre diferentes LLMs para respostas otimizadas</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Consenso Inteligente</h3>
              <p className="text-gray-600">Sistema de consenso que garante respostas mais precisas e confiáveis</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Livre</h3>
              <p className="text-gray-600">Experimente gratuitamente sem necessidade de cadastro ou login</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pronto para experimentar?
          </h2>
          <p className="text-gray-600 mb-8">
            Teste agora mesmo nosso chat inteligente
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Ir para o Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
