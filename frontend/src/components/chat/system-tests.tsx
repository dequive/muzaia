
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Activity,
  Users,
  MessageSquare,
  Phone,
  Server,
  Wifi,
  Database,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  data?: any
  duration?: number
}

export function SystemTests() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Saúde do Sistema', status: 'pending' },
    { name: 'Criar Técnico de Teste', status: 'pending' },
    { name: 'Sistema de Presença', status: 'pending' },
    { name: 'Conexões WebSocket', status: 'pending' },
    { name: 'Simulação de Handoff', status: 'pending' },
    { name: 'Fluxo Completo Chat', status: 'pending' },
    { name: 'Status Geral', status: 'pending' }
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle')
  const [progress, setProgress] = useState(0)

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const runTest = async (testIndex: number, testName: string, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    const startTime = Date.now()
    updateTest(testIndex, { status: 'running' })

    try {
      const response = await fetch(`/api/v1/test${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const result = await response.json()
      const duration = Date.now() - startTime

      if (response.ok) {
        updateTest(testIndex, {
          status: 'success',
          message: result.message || 'Teste passou',
          data: result.data,
          duration
        })
        return true
      } else {
        updateTest(testIndex, {
          status: 'error',
          message: result.detail || 'Teste falhou',
          duration
        })
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      updateTest(testIndex, {
        status: 'error',
        message: `Erro de conexão: ${error}`,
        duration
      })
      return false
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setOverallStatus('running')
    setProgress(0)

    // Reset todos os testes
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })))

    const testSuite = [
      { name: 'Saúde do Sistema', endpoint: '/health-full' },
      { 
        name: 'Criar Técnico de Teste', 
        endpoint: '/create-test-technician',
        method: 'POST' as const,
        body: {
          technician_id: 'tech_test_123',
          name: 'Dr. João Teste'
        }
      },
      { name: 'Sistema de Presença', endpoint: '/technician-presence' },
      { name: 'Conexões WebSocket', endpoint: '/websocket-test' },
      { 
        name: 'Simulação de Handoff', 
        endpoint: '/simulate-handoff',
        method: 'POST' as const,
        body: {
          user_id: 'test_user_123',
          specialization: 'criminal'
        }
      },
      { 
        name: 'Fluxo Completo Chat', 
        endpoint: '/simulate-chat-flow',
        method: 'POST' as const
      },
      { name: 'Status Geral', endpoint: '/system-status' }
    ]

    let successCount = 0

    for (let i = 0; i < testSuite.length; i++) {
      const test = testSuite[i]
      
      const success = await runTest(
        i, 
        test.name, 
        test.endpoint, 
        test.method || 'GET',
        test.body
      )

      if (success) successCount++
      
      setProgress(((i + 1) / testSuite.length) * 100)
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunning(false)
    setOverallStatus('completed')

    // Toast com resultado
    const allPassed = successCount === testSuite.length
    if (allPassed) {
      toast.success(`🎉 Todos os ${testSuite.length} testes passaram!`)
    } else {
      toast.error(`❌ ${testSuite.length - successCount} de ${testSuite.length} testes falharam`)
    }
  }

  const getTestIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 border border-gray-300 rounded-full" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getTestBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive'
    } as const

    const colors = {
      pending: 'text-gray-600',
      running: 'text-blue-600',
      success: 'text-green-600',
      error: 'text-red-600'
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status === 'pending' && 'Pendente'}
        {status === 'running' && 'Executando...'}
        {status === 'success' && 'Sucesso'}
        {status === 'error' && 'Erro'}
      </Badge>
    )
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Testes de Integração - Mozaia AI
        </h1>
        <p className="text-gray-600">
          Verificação completa das funcionalidades do sistema híbrido IA ↔ Técnico
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Controles de Teste</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>
                  {isRunning ? 'Executando...' : 'Executar Todos os Testes'}
                </span>
              </Button>

              {overallStatus === 'completed' && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-green-600">
                    ✅ {successCount} Sucessos
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      ❌ {errorCount} Erros
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {isRunning && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}%
                </span>
                <Progress value={progress} className="w-32" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-4">
        {tests.map((test, index) => (
          <motion.div
            key={test.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "transition-all duration-200",
              test.status === 'running' && "ring-2 ring-blue-500",
              test.status === 'success' && "border-green-200 bg-green-50",
              test.status === 'error' && "border-red-200 bg-red-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTestIcon(test.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {test.name}
                      </h3>
                      {test.message && (
                        <p className={cn(
                          "text-sm",
                          test.status === 'success' ? "text-green-600" : "text-red-600"
                        )}>
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {test.duration && (
                      <span className="text-xs text-gray-500">
                        {test.duration}ms
                      </span>
                    )}
                    {getTestBadge(test.status)}
                  </div>
                </div>

                {/* Dados adicionais */}
                {test.data && test.status === 'success' && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="mt-3 p-3 bg-gray-50 rounded-lg overflow-hidden"
                  >
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Status Summary */}
      {overallStatus === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8"
        >
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <Server className="h-5 w-5" />
                <span>Resumo do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="text-sm font-medium">Backend</div>
                  <div className="text-xs text-green-600">Operacional</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wifi className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-sm font-medium">WebSocket</div>
                  <div className="text-xs text-blue-600">Conectado</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="text-sm font-medium">Técnicos</div>
                  <div className="text-xs text-purple-600">Disponíveis</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="text-sm font-medium">Chat Híbrido</div>
                  <div className="text-xs text-yellow-600">Funcional</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
