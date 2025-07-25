
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Link>
              
              <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                    Muzaia
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Assistente jurídico especializado</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Online</span>
              </div>
              
              <Link 
                href="/chat-legal"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              >
                Consulta Legal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-blue-500/5 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Como posso te ajudar hoje?
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sou seu assistente jurídico especializado em direito moçambicano
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Conectado</span>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="h-[600px]">
            <ChatInterface />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { title: "Direito de Propriedade", subtitle: "Questões sobre propriedade em Moçambique" },
            { title: "Processo de Divórcio", subtitle: "Como funciona o processo de divórcio?" },
            { title: "Direitos Trabalhistas", subtitle: "Quais são os direitos trabalhistas básicos?" },
            { title: "Constituição", subtitle: "Principais artigos da constituição moçambicana" }
          ].map((item, index) => (
            <div
              key={item.title}
              className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group"
            >
              <h3 className="font-medium text-slate-900 dark:text-white text-sm mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {item.subtitle}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💡 Dica: Como fazer uma boa pergunta
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Seja específico sobre sua situação e inclua contexto relevante. 
              Quanto mais detalhes, melhor posso te ajudar!
            </p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-700/50">
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              🔒 Privacidade Garantida
            </h3>
            <p className="text-sm text-green-800 dark:text-green-400">
              Suas conversas são criptografadas e protegidas. 
              Não compartilhamos suas informações pessoais.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
