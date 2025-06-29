// Usage history component
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  TrendingUp, 
  Calendar,
  MoreVertical,
  MessageSquare,
  Brain,
  Target 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChat } from '@/hooks/useChat'
import { formatRelativeTime, formatDate } from '@/lib/utils'

export function UsageHistory() {
  const { conversations } = useChat()
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week')

  // Filter conversations by time
  const filteredConversations = conversations
    .filter(conv => {
      if (timeFilter === 'all') return true
      
      const convDate = new Date(conv.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (timeFilter === 'week') return diffDays <= 7
      if (timeFilter === 'month') return diffDays <= 30
      
      return true
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10) // Show last 10

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'technical': return Brain
      case 'legal': return Target
      case 'business': return TrendingUp
      case 'academic': return Calendar
      default: return MessageSquare
    }
  }

  const getContextColor = (context: string) => {
    switch (context) {
      case 'technical': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'legal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'business': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'academic': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Suas conversas mais recentes
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeFilter('week')}>
                Última semana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('month')}>
                Último mês
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('all')}>
                Todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conversation, index) => {
              const ContextIcon = getContextIcon(conversation.context)
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-muted rounded-lg">
                      <ContextIcon className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getContextColor(conversation.context)}`}
                      >
                        {conversation.context}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {conversation.message_count} mensagens
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.updated_at)}
                    </p>
                    {conversation.avg_confidence && conversation.avg_confidence > 0.8 && (
                      <div className="flex items-center justify-end mt-1">
                        <Target className="h-3 w-3 text-green-500" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
        
        {filteredConversations.length > 0 && (
          <div className="text-center pt-4 border-t mt-4">
            <Button variant="ghost" size="sm">
              Ver todas as conversas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
