// Profile statistics component
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Target,
  BarChart3,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useChat } from '@/hooks/useChat'
import { formatNumber } from '@/lib/utils'

interface UserStats {
  totalConversations: number
  totalMessages: number
  avgConfidence: number
  totalTime: number
  favoriteContext: string
  streak: number
  totalTokens: number
  totalCost: number
}

export function ProfileStats() {
  const { conversations } = useChat()
  const [stats, setStats] = useState<UserStats>({
    totalConversations: 0,
    totalMessages: 0,
    avgConfidence: 0,
    totalTime: 0,
    favoriteContext: 'general',
    streak: 0,
    totalTokens: 0,
    totalCost: 0,
  })

  useEffect(() => {
    // Calculate stats from conversations
    if (conversations.length > 0) {
      const totalConversations = conversations.length
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.message_count, 0)
      const avgConfidence = conversations.reduce((sum, conv) => sum + (conv.avg_confidence || 0), 0) / totalConversations
      const totalTokens = conversations.reduce((sum, conv) => sum + (conv.total_tokens || 0), 0)
      const totalCost = conversations.reduce((sum, conv) => sum + (conv.total_cost || 0), 0)

      // Find favorite context
      const contextCounts = conversations.reduce((acc, conv) => {
        acc[conv.context] = (acc[conv.context] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const favoriteContext = Object.entries(contextCounts).reduce((a, b) => 
        contextCounts[a[0]] > contextCounts[b[0]] ? a : b
      )[0] || 'general'

      setStats({
        totalConversations,
        totalMessages,
        avgConfidence,
        totalTime: 0, // TODO: Calculate from message timestamps
        favoriteContext,
        streak: 7, // TODO: Calculate streak
        totalTokens,
        totalCost,
      })
    }
  }, [conversations])

  const statCards = [
    {
      title: 'Conversas',
      value: formatNumber(stats.totalConversations),
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Mensagens',
      value: formatNumber(stats.totalMessages),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Confiança Média',
      value: `${Math.round(stats.avgConfidence * 100)}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Tokens Usados',
      value: formatNumber(stats.totalTokens),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Estatísticas
        </CardTitle>
        <CardDescription>
          Resumo da sua atividade no Mozaia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Favorite Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contexto Favorito</span>
            <Badge variant="secondary">{stats.favoriteContext}</Badge>
          </div>
        </div>

        {/* Confidence Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confiança Média</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(stats.avgConfidence * 100)}%
            </span>
          </div>
          <Progress value={stats.avgConfidence * 100} className="h-2" />
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Sequência de dias</p>
              <p className="text-xs text-muted-foreground">Consecutivos ativos</p>
            </div>
          </div>
          <span className="text-xl font-bold text-yellow-600">
            {stats.streak}
          </span>
        </div>

        {/* Cost Info */}
        {stats.totalCost > 0 && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Custo total estimado: ${stats.totalCost.toFixed(4)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
