// System overview component
'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Server,
  Zap,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSystem } from '@/hooks/useSystem'
import { formatNumber, formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function SystemOverview() {
  const { health, metrics, systemStatus } = useSystem()

  const statusCards = [
    {
      title: 'Status Geral',
      value: health?.status || 'unknown',
      icon: Activity,
      color: systemStatus.isHealthy ? 'text-green-600' : 'text-red-600',
      bgColor: systemStatus.isHealthy ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900',
    },
    {
      title: 'Uptime',
      value: health?.uptime ? `${Math.floor(health.uptime / 3600)}h` : '0h',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Modelos Ativos',
      value: health?.models_available?.length || 0,
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Versão',
      value: health?.version || 'N/A',
      icon: Server,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ]

  const performanceMetrics = [
    {
      label: 'CPU Usage',
      value: 45,
      max: 100,
      unit: '%',
      color: 'bg-blue-500',
    },
    {
      label: 'Memory Usage',
      value: 68,
      max: 100,
      unit: '%',
      color: 'bg-green-500',
    },
    {
      label: 'Disk Usage',
      value: 32,
      max: 100,
      unit: '%',
      color: 'bg-yellow-500',
    },
    {
      label: 'Network I/O',
      value: 28,
      max: 100,
      unit: '%',
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg', card.bgColor)}>
                    <card.icon className={cn('h-4 w-4', card.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {card.title}
                    </p>
                    <p className="text-lg font-semibold">
                      {card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Saúde do Sistema
          </CardTitle>
          <CardDescription>
            Status dos componentes principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {health?.components && Object.entries(health.components).map(([component, status]) => (
              <div key={component} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {status === 'healthy' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium capitalize">{component}</span>
                </div>
                <Badge variant={status === 'healthy' ? 'default' : 'destructive'}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance
          </CardTitle>
          <CardDescription>
            Uso de recursos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">
                {formatNumber(metrics.http_metrics?.total_requests || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total de Requisições</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {(metrics.orchestrator_metrics?.avg_response_time || 0).toFixed(2)}s
              </p>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {formatNumber(metrics.pool_metrics?.active_instances || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Instâncias Ativas</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
