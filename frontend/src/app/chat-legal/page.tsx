
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LegalChatInterface from '@/components/chat/legal-chat-interface'

export default function LegalChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Chat Legal Inteligente</h1>
          <p className="text-gray-600">
            Sistema de assistência jurídica baseado em busca semântica no repositório de leis
          </p>
        </div>
        
        <Card className="h-[calc(100vh-200px)]">
          <CardContent className="h-full p-0">
            <LegalChatInterface />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
