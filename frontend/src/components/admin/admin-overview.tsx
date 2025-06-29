// Admin overview component
'use client'

import { motion } from 'framer-motion'
import {
  Users,
  MessageSquare,
  Server,
  AlertTriangle,
  TrendingUp,
  Database,
  Shield,
  Activity,
  Clock,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSystem } from '@/hooks/useSystem'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function AdminOverview() {
  const { health, metrics, systemStatus } = useSystem()

  const adminStats = [
    {
      title: 'Usuários Ativos',
      value: '2,847',
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      trend: 'up',
    },
    {
      title: 'Conversas Hoje',
      value: '1,234',
      change: '+8.2%',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      trend: 'up',
    },
    {
      title: 'Uptime',
      value: '99.98%',
      change: '+0.01%',
      icon: Server,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      trend: 'up',
    },
    {
      title: 'Alertas',
      value: '3',
      change: '-2',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      trend: 'down',
    },
  ]

  const systemHealth = [
    { name: 'API Gateway', status: 'healthy', uptime: 99.99 },
    { name: 'LLM Pool', status: 'healthy', uptime: 99.95 },
    { name: 'Database', status: 'healthy', uptime: 99.98 },
    { name: 'Cache', status: 'warning', uptime: 98.50 },
    { name: 'Authentication', status: 'healthy', uptime: 99.99 },
    { name: 'File Storage', status: 'healthy', uptime: 99.97 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                      <stat.icon className={cn('h-4 w-4', stat.color)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                      <p className="text-lg font-semibold">{stat.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-xs font-medium',
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.change}
                    </p>
                    <TrendingUp className={cn(
                      'h-3 w-3',
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600 rotate-180'
                    )} />
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
            Status dos Componentes
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real de todos os serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((component, index) => (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', getStatusColor(component.status))} />
                  <span className="font-medium">{component.name}</span>
                  <Badge variant={getStatusBadge(component.status) as any}>
                    {component.status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{component.uptime}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="w-20">
                    <Progress value={component.uptime} className="h-2" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usado</span>
                <span>245 GB / 500 GB</span>
              </div>
              <Progress value={49} className="h-2" />
              <p className="text-xs text-muted-foreground">49% utilizado</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uso médio</span>
                <span>67%</span>
              </div>
              <Progress value={67} className="h-2" />
              <p className="text-xs text-muted-foreground">4 cores ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Memória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uso atual</span>
                <span>12.3 GB / 16 GB</span>
              </div>
              <Progress value={77} className="h-2" />
              <p className="text-xs text-muted-foreground">77% utilizada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Time & Build Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data/Hora Atual:</span>
              <p className="font-medium">29/06/2025 03:45:05 UTC</p>
            </div>
            <div>
              <span className="text-muted-foreground">Versão:</span>
              <p className="font-medium">v2.0.0</p>
            </div>
            <div>
              <span className="text-muted-foreground">Build:</span>
              <p className="font-medium">#1247</p>
            </div>
            <div>
              <span className="text-muted-foreground">Último Deploy:</span>
              <p className="font-medium">28/06/2025 18:30</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
