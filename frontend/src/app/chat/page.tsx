
'use client'

import { Suspense } from 'react'
import ChatInterface from '@/components/chat/chat-interface'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Sparkles, Zap, Shield } from 'lucide-react'

function ChatPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Mozaia Chat
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">IA Assistente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Zap className="h-4 w-4" />
                  <span>Modo Rápido</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Shield className="h-4 w-4" />
                  <span>Seguro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="h-screen bg-white dark:bg-slate-900">
        <ChatInterface />
      </main>
    </div>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="h-[calc(100vh-120px)]">
          <Card className="h-full border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-xl p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-12 w-full" />
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
