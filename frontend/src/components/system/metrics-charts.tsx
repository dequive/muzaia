// Advanced metrics charts component
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Zap,
  Target,
  Download,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSystem } from '@/hooks/useSystem'
import { useChat } from '@/hooks/useChat'
import { formatNumber } from '@/lib/utils'

// Mock data generators for demonstration
const generateTimeSeriesData = (days: number) => {
  const data = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 1000) + 500,
      responseTime: Math.random() * 2 + 0.5,
      confidence: Math.random() * 0.3 + 0.7,
      errors: Math.floor(Math.random() * 20),
      tokens: Math.floor(Math.random() * 50000) + 10000,
    })
  }
  
  return data
}

const generateModelUsageData = () => [
  { name: 'llama3:8b', usage: 45, color: '#0ea5e9' },
  { name: 'gemma2:9b', usage: 30, color: '#10b981' },
  { name: 'qwen-72b', usage: 15, color: '#8b5cf6' },
  { name: 'command-r-plus', usage: 10, color: '#f59e0b' },
]

const generateContextData = () => [
  { context: 'Geral', count: 120, percentage: 40 },
  { context: 'Técnico', count: 80, percentage: 27 },
  { context: 'Negócios', count: 60, percentage: 20 },
  { context: 'Jurídico', count: 25, percentage: 8 },
  { context: 'Acadêmico', count: 15, percentage: 5 },
]

interface MetricsChartsProps {
  className?: string
}

export function MetricsCharts({ className }: MetricsChartsProps) {
  const { metrics, refetchMetrics } = useSystem()
  const { conversations } = useChat()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Generate chart data based on time range
  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    return generateTimeSeriesData(days)
  }, [timeRange])

  const modelUsageData = useMemo(() => generateModelUsageData(), [])
  const contextData = useMemo(() => generateContextData(), [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchMetrics()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const exportData = () => {
    const data = {
      chartData,
      modelUsageData,
      contextData,
      exportedAt: new Date().toISOString(),
      timeRange,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mozaia-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Métricas e Analytics
              </CardTitle>
              <CardDescription>
                Visualização avançada de dados do sistema
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="usage">Uso</TabsTrigger>
              <TabsTrigger value="models">Modelos</TabsTrigger>
              <TabsTrigger value="context">Contextos</TabsTrigger>
            </TabsList>

            {/* Performance Charts */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Tempo de Resposta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ')}
                          formatter={(value: any) => [`${value.toFixed(2)}s`, 'Tempo']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="responseTime" 
                          stroke="#0ea5e9" 
                          strokeWidth={2}
                          dot={{ fill: '#0ea5e9', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

                {/* Confidence Score Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Score de Confiança
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} domain={[0.5, 1]} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ')}
                          formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Confiança']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="confidence" 
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Requests Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Requisições e Erros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ')}
                      />
                      <Legend />
                      <Bar dataKey="requests" fill="#0ea5e9" name="Requisições" />
                      <Bar dataKey="errors" fill="#ef4444" name="Erros" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Charts */}
            <TabsContent value="usage" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tokens Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Uso de Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-MZ')}
                          formatter={(value: any) => [formatNumber(value), 'Tokens']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tokens" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Daily Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estatísticas Diárias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(chartData[chartData.length - 1]?.requests || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Requisições Hoje</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {((chartData[chartData.length - 1]?.confidence || 0) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Confiança Média</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatNumber(chartData[chartData.length - 1]?.tokens || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Tokens Usados</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {(chartData[chartData.length - 1]?.responseTime || 0).toFixed(2)}s
                        </p>
                        <p className="text-xs text-muted-foreground">Tempo Médio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Model Usage Charts */}
            <TabsContent value="models" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Model Usage Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <PieChartIcon className="h-4 w-4 mr-2" />
                      Distribuição por Modelo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={modelUsageData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="usage"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {modelUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Model Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Performance por Modelo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {modelUsageData.map((model, index) => (
                      <motion.div
                        key={model.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: model.color }}
                          />
                          <span className="text-sm font-medium">{model.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{model.usage}%</Badge>
                          <span className="text-xs text-muted-foreground">
                            ~{Math.floor(Math.random() * 500 + 100)} req/h
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Context Usage */}
            <TabsContent value="context" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Uso por Contexto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contextData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="context" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
