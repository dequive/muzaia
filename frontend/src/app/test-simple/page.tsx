
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  data?: any
  duration?: number
}

export default function TestSimplePage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Ping Backend', status: 'pending' },
    { name: 'Health Check', status: 'pending' },
    { name: 'Echo Test', status: 'pending' },
    { name: 'Legal Chat Status', status: 'pending' }
  ])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const runTest = async (testName: string, index: number) => {
    const startTime = Date.now()
    updateTest(index, { status: 'pending' })

    try {
      let response
      switch (testName) {
        case 'Ping Backend':
          response = await fetch('http://localhost:8000/api/test/ping')
          break
        case 'Health Check':
          response = await fetch('http://localhost:8000/api/test/health')
          break
        case 'Echo Test':
          response = await fetch('http://localhost:8000/api/test/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'dados de teste', timestamp: new Date() })
          })
          break
        case 'Legal Chat Status':
          response = await fetch('http://localhost:8000/api/test/legal-chat-test')
          break
        default:
          throw new Error('Teste não encontrado')
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      updateTest(index, {
        status: 'success',
        message: data.message || 'Sucesso',
        data,
        duration
      })

    } catch (error) {
      const duration = Date.now() - startTime
      updateTest(index, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        duration
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    for (let i = 0; i < tests.length; i++) {
      await runTest(tests[i].name, i)
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Teste Simples do Sistema</h1>
          <p className="text-gray-600">
            Verificação básica das funcionalidades principais
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Controles de Teste
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isRunning ? 'Executando...' : 'Executar Todos'}
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      {test.message && (
                        <p className="text-sm text-gray-600">{test.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-xs text-gray-500">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTest(test.name, index)}
                      disabled={isRunning}
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {test.data && test.status === 'success' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Próximos Passos</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Se todos os testes passarem, o sistema está operacional</li>
              <li>• Acesse <code>/chat-legal</code> para testar o chat jurídico</li>
              <li>• Use <code>/admin/legal</code> para gerenciar o repositório legal</li>
              <li>• Teste perguntas como: "Quais são os meus direitos como trabalhador?"</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
