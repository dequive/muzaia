
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

export function IntegrationTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    health?: any
    conversations?: any
    messages?: any
    errors?: string[]
  }>({})

  const runIntegrationTests = async () => {
    setTesting(true)
    setResults({})
    const errors: string[] = []

    try {
      // Test 1: Health check
      console.log('Testing backend health...')
      const healthResponse = await api.get('/health')
      setResults(prev => ({ ...prev, health: healthResponse }))
      toast.success('✅ Health check passou!')
    } catch (error) {
      console.error('Health check failed:', error)
      errors.push('Health check falhou')
      toast.error('❌ Health check falhou')
    }

    try {
      // Test 2: Get conversations
      console.log('Testing conversations endpoint...')
      const conversationsResponse = await api.get('/api/v1/conversations')
      setResults(prev => ({ ...prev, conversations: conversationsResponse }))
      toast.success('✅ Endpoint de conversas funcionando!')
    } catch (error) {
      console.error('Conversations test failed:', error)
      errors.push('Endpoint de conversas falhou')
      toast.error('❌ Endpoint de conversas falhou')
    }

    try {
      // Test 3: Get messages
      console.log('Testing messages endpoint...')
      const messagesResponse = await api.get('/api/v1/conversations/1/messages')
      setResults(prev => ({ ...prev, messages: messagesResponse }))
      toast.success('✅ Endpoint de mensagens funcionando!')
    } catch (error) {
      console.error('Messages test failed:', error)
      errors.push('Endpoint de mensagens falhou')
      toast.error('❌ Endpoint de mensagens falhou')
    }

    setResults(prev => ({ ...prev, errors }))
    setTesting(false)

    if (errors.length === 0) {
      toast.success('🎉 Todos os testes passaram! Integração funcionando!')
    } else {
      toast.error(`❌ ${errors.length} teste(s) falharam`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Teste de Integração Frontend-Backend</h3>
        <Button onClick={runIntegrationTests} disabled={testing}>
          {testing ? 'Testando...' : 'Executar Testes'}
        </Button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {/* Health Check */}
          {results.health && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Health Check</h4>
                <Badge variant="default">✅ Sucesso</Badge>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(results.health, null, 2)}
              </pre>
            </Card>
          )}

          {/* Conversations */}
          {results.conversations && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Conversas</h4>
                <Badge variant="default">✅ Sucesso</Badge>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(results.conversations, null, 2)}
              </pre>
            </Card>
          )}

          {/* Messages */}
          {results.messages && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Mensagens</h4>
                <Badge variant="default">✅ Sucesso</Badge>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(results.messages, null, 2)}
              </pre>
            </Card>
          )}

          {/* Errors */}
          {results.errors && results.errors.length > 0 && (
            <Card className="p-4 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-red-600">Erros</h4>
                <Badge variant="destructive">❌ {results.errors.length} erro(s)</Badge>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {results.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
