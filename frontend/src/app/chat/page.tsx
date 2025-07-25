
'use client'

import { Suspense } from 'react'
import ChatInterface from '@/components/chat/chat-interface'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Sparkles, Zap, Shield, Brain, Clock } from 'lucide-react'

function ChatPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  Mozaia Legal AI
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assistente Jurídico Inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-8 text-sm">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Online</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <Brain className="h-4 w-4" />
                  <span>IA Avançada</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Shield className="h-4 w-4" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                  <Clock className="h-4 w-4" />
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="h-[calc(100vh-88px)] bg-white dark:bg-gray-900 shadow-inner">
        <ChatInterface />
      </main>
    </div>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950/20">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="h-[calc(100vh-120px)]">
          <Card className="h-full border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl p-8 rounded-3xl">
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl animate-pulse"></div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-20 w-3/4 rounded-2xl" />
                <Skeleton className="h-16 w-1/2 rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
              <div className="mt-8">
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <ChatPageContent />
    </Suspense>
  )
}
