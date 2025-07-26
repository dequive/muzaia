
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Activity,
  Shield,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  FileText,
  Calendar,
  Filter,
  MessageSquare,
  Scale,
  UserCheck,
  Eye,
  Edit
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatNumber } from '@/lib/utils'

interface MetricsData {
  user_behavior: {
    active_users: {
      daily_active: number
      weekly_active: number
      monthly_active: number
      growth_rate: number
    }
    session_metrics: {
      avg_session_duration: number
      sessions_per_user: number
      bounce_rate: number
      retention_rate: number
    }
    feature_usage: {
      chat_conversations: number
      document_uploads: number
      legal_consultations: number
      professional_handoffs: number
    }
    geographic_distribution: Array<{
      country: string
      users: number
      percentage: number
    }>
  }
  model_performance: {
    response_times: Record<string, { avg: number; p95: number; p99: number }>
    token_usage: {
      total_tokens_processed: number
      input_tokens: number
      output_tokens: number
      cost_estimate: number
    }
    model_distribution: Array<{
      model: string
      usage_percentage: number
      requests: number
    }>
    availability: Record<string, number>
  }
  quality: {
    user_satisfaction: {
      avg_rating: number
      total_ratings: number
      rating_distribution: Record<string, number>
    }
    response_quality: {
      accuracy_score: number
      relevance_score: number
      completeness_score: number
      helpfulness_score: number
    }
    legal_accuracy: {
      verified_responses: number
      accuracy_rate: number
      professional_corrections: number
      user_disputes: number
    }
  }
  security: {
    threat_detection: {
      blocked_requests: number
      malicious_uploads: number
      spam_attempts: number
      rate_limit_violations: number
    }
    content_moderation: {
      flagged_conversations: number
      inappropriate_content: number
      user_reports: number
      automated_blocks: number
    }
    security_incidents: {
      failed_login_attempts: number
      suspicious_activities: number
      account_lockouts: number
      security_alerts: number
    }
  }
  other_indicators: {
    system_health: {
      cpu_usage: number
      memory_usage: number
      disk_usage: number
      network_latency: number
    }
    business_metrics: {
      conversion_rate: number
      customer_lifetime_value: number
      churn_rate: number
      revenue_per_user: number
    }
    operational_metrics: {
      support_tickets: number
      resolution_time: number
      first_response_time: number
      customer_satisfaction: number
    }
  }
}

export function AdvancedMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')
  const [isExporting, setIsExporting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/v1/admin/metrics/comprehensive?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.metrics)
        setLastUpdate(new Date())
      } else {
        throw new Error(data.message || 'Erro ao carregar métricas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    try {
      setIsExporting(true)
      
      const response = await fetch(`/api/v1/admin/metrics/export/pdf?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF')
      }
      
      // Download do arquivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mozaia_metrics_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Métricas Administrativas</h1>
            <p className="text-muted-foreground">Carregando métricas do sistema...</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar métricas: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchMetrics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métricas Administrativas</h1>
          <p className="text-muted-foreground">
            Análise completa do sistema e utilizadores
            {lastUpdate && (
              <span className="ml-2">
                • Última atualização: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
          >
            <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
            {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Utilizadores Ativos</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.active_users.monthly_active)}</p>
                <p className="text-xs text-green-600">
                  +{metrics.user_behavior.active_users.growth_rate}% este mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Conversas</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.feature_usage.chat_conversations)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics.user_behavior.feature_usage.legal_consultations)} legais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Satisfação</p>
                <p className="text-2xl font-bold">{metrics.quality.user_satisfaction.avg_rating.toFixed(1)}/5.0</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics.quality.user_satisfaction.total_ratings)} avaliações
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Segurança</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.security.threat_detection.blocked_requests)}</p>
                <p className="text-xs text-muted-foreground">ameaças bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Tab 1: User Behavior */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Utilizadores Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Diários</span>
                    <span className="font-semibold">{formatNumber(metrics.user_behavior.active_users.daily_active)}</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Semanais</span>
                    <span className="font-semibold">{formatNumber(metrics.user_behavior.active_users.weekly_active)}</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Mensais</span>
                    <span className="font-semibold">{formatNumber(metrics.user_behavior.active_users.monthly_active)}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Session Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Métricas de Sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Duração Média</span>
                  <Badge variant="outline">{metrics.user_behavior.session_metrics.avg_session_duration.toFixed(1)} min</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sessões/Utilizador</span>
                  <Badge variant="outline">{metrics.user_behavior.session_metrics.sessions_per_user.toFixed(1)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Rejeição</span>
                  <Badge variant={metrics.user_behavior.session_metrics.bounce_rate < 0.2 ? "default" : "destructive"}>
                    {(metrics.user_behavior.session_metrics.bounce_rate * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Retenção</span>
                  <Badge variant="default">
                    {(metrics.user_behavior.session_metrics.retention_rate * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Uso de Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.feature_usage.chat_conversations)}</p>
                  <p className="text-sm text-muted-foreground">Conversas de Chat</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.feature_usage.document_uploads)}</p>
                  <p className="text-sm text-muted-foreground">Documentos Enviados</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Scale className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.feature_usage.legal_consultations)}</p>
                  <p className="text-sm text-muted-foreground">Consultas Legais</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.user_behavior.feature_usage.professional_handoffs)}</p>
                  <p className="text-sm text-muted-foreground">Transferências</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Geográfica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.user_behavior.geographic_distribution.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Progress value={country.percentage} className="w-24 h-2" />
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold">{formatNumber(country.users)}</p>
                        <p className="text-xs text-muted-foreground">{country.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Model Performance */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Tempos de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics.model_performance.response_times).map(([model, times]) => (
                  <div key={model} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <Badge variant="outline">{times.avg.toFixed(1)}s avg</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      P95: {times.p95.toFixed(1)}s | P99: {times.p99.toFixed(1)}s
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Model Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribuição de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.model_performance.model_distribution.map((model, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{model.model}</span>
                      <span className="text-sm">{model.usage_percentage}%</span>
                    </div>
                    <Progress value={model.usage_percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(model.requests)} requisições
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Token Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Uso de Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(metrics.model_performance.token_usage.total_tokens_processed)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Processados</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(metrics.model_performance.token_usage.input_tokens)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tokens de Entrada</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(metrics.model_performance.token_usage.output_tokens)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tokens de Saída</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    ${metrics.model_performance.token_usage.cost_estimate.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Custo Estimado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Quality */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Satisfação do Utilizador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">
                    {metrics.quality.user_satisfaction.avg_rating.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    de 5.0 ({formatNumber(metrics.quality.user_satisfaction.total_ratings)} avaliações)
                  </p>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(metrics.quality.user_satisfaction.rating_distribution)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([rating, percentage]) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <span className="text-sm w-8">{rating}★</span>
                      <Progress value={Number(percentage)} className="flex-1 h-2" />
                      <span className="text-sm w-12 text-right">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Quality Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Scores de Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Precisão</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.quality.response_quality.accuracy_score * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{(metrics.quality.response_quality.accuracy_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Relevância</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.quality.response_quality.relevance_score * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{(metrics.quality.response_quality.relevance_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completude</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.quality.response_quality.completeness_score * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{(metrics.quality.response_quality.completeness_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Utilidade</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.quality.response_quality.helpfulness_score * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{(metrics.quality.response_quality.helpfulness_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legal Accuracy */}
          <Card>
            <CardHeader>
              <CardTitle>Precisão Legal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.quality.legal_accuracy.verified_responses)}</p>
                  <p className="text-sm text-muted-foreground">Respostas Verificadas</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{(metrics.quality.legal_accuracy.accuracy_rate * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Precisão</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Edit className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.quality.legal_accuracy.professional_corrections)}</p>
                  <p className="text-sm text-muted-foreground">Correções Profissionais</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold">{formatNumber(metrics.quality.legal_accuracy.user_disputes)}</p>
                  <p className="text-sm text-muted-foreground">Disputas de Utilizadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Threat Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Deteção de Ameaças
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Requisições Bloqueadas</span>
                  <Badge variant="destructive">{formatNumber(metrics.security.threat_detection.blocked_requests)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Uploads Maliciosos</span>
                  <Badge variant="destructive">{formatNumber(metrics.security.threat_detection.malicious_uploads)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tentativas de Spam</span>
                  <Badge variant="destructive">{formatNumber(metrics.security.threat_detection.spam_attempts)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Violações Rate Limit</span>
                  <Badge variant="destructive">{formatNumber(metrics.security.threat_detection.rate_limit_violations)}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Content Moderation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Moderação de Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conversas Sinalizadas</span>
                  <Badge variant="outline">{formatNumber(metrics.security.content_moderation.flagged_conversations)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conteúdo Inapropriado</span>
                  <Badge variant="destructive">{formatNumber(metrics.security.content_moderation.inappropriate_content)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Relatórios de Utilizadores</span>
                  <Badge variant="outline">{formatNumber(metrics.security.content_moderation.user_reports)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bloqueios Automáticos</span>
                  <Badge variant="secondary">{formatNumber(metrics.security.content_moderation.automated_blocks)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Incidents */}
          <Card>
            <CardHeader>
              <CardTitle>Incidentes de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(metrics.security.security_incidents.failed_login_attempts)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tentativas de Login Falhadas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(metrics.security.security_incidents.suspicious_activities)}
                  </p>
                  <p className="text-sm text-muted-foreground">Atividades Suspeitas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatNumber(metrics.security.security_incidents.account_lockouts)}
                  </p>
                  <p className="text-sm text-muted-foreground">Contas Bloqueadas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(metrics.security.security_incidents.security_alerts)}
                  </p>
                  <p className="text-sm text-muted-foreground">Alertas de Segurança</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: System Indicators */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.other_indicators.system_health.cpu_usage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.other_indicators.system_health.cpu_usage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memória</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.other_indicators.system_health.memory_usage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.other_indicators.system_health.memory_usage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disco</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.other_indicators.system_health.disk_usage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.other_indicators.system_health.disk_usage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Latência de Rede</span>
                    <Badge variant="outline">{metrics.other_indicators.system_health.network_latency}ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Métricas de Negócio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Conversão</span>
                  <Badge variant="default">{(metrics.other_indicators.business_metrics.conversion_rate * 100).toFixed(2)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Valor de Vida do Cliente</span>
                  <Badge variant="default">${metrics.other_indicators.business_metrics.customer_lifetime_value.toFixed(2)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Churn</span>
                  <Badge variant={metrics.other_indicators.business_metrics.churn_rate < 0.1 ? "default" : "destructive"}>
                    {(metrics.other_indicators.business_metrics.churn_rate * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Receita por Utilizador</span>
                  <Badge variant="default">${metrics.other_indicators.business_metrics.revenue_per_user.toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(metrics.other_indicators.operational_metrics.support_tickets)}
                  </p>
                  <p className="text-sm text-muted-foreground">Tickets de Suporte</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.other_indicators.operational_metrics.resolution_time.toFixed(1)}h
                  </p>
                  <p className="text-sm text-muted-foreground">Tempo de Resolução</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.other_indicators.operational_metrics.first_response_time.toFixed(1)}h
                  </p>
                  <p className="text-sm text-muted-foreground">Primeira Resposta</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.other_indicators.operational_metrics.customer_satisfaction.toFixed(1)}/5.0
                  </p>
                  <p className="text-sm text-muted-foreground">Satisfação Cliente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
