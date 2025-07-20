'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter,
  MessageSquare, 
  Clock,
  Archive,
  Trash2,
  Settings,
  ChevronDown,
  X,
  Brain,
  Zap,
  Target,
  Shield,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/store'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/date'
import type { Conversation, ContextType } from '@/types'

const contextOptions = [
  { value: 'general', label: 'Geral', icon: Brain, color: 'bg-blue-100 text-blue-800' },
  { value: 'technical', label: 'Técnico', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'legal', label: 'Jurídico', icon: Shield, color: 'bg-red-100 text-red-800' },
  { value: 'business', label: 'Negócios', icon: Target, color: 'bg-green-100 text-green-800' },
  { value: 'academic', label: 'Acadêmico', icon: HelpCircle, color: 'bg-purple-100 text-purple-800' },
]

// Client-only time component to prevent hydration errors
function ClientTime({ date }: { date: string }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <span>{formatDate(date)}</span>
  }

  return <span>{formatDate(date)}</span>
}

export function Sidebar() {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation, createConversation } = useChatStore()
  const { ui, updateUI } = useUIStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContext, setFilterContext] = useState<ContextType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filtrar conversas
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.messages?.some(msg => 
                           msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    const matchesContext = filterContext === 'all' || conv.context === filterContext
    return matchesSearch && matchesContext
  })

  const handleNewChat = () => {
    createConversation()
  }

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      deleteConversation(id)
    }
  }

  const getContextOption = (context: ContextType) => {
    return contextOptions.find(opt => opt.value === context) || contextOptions[0]
  }

  return (
    <div className={cn(
      "h-full bg-background border-r border-border flex flex-col transition-all duration-300",
      ui.sidebar_collapsed ? "w-16" : "w-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        {!ui.sidebar_collapsed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
              <Button
                onClick={() => updateUI({ chat_settings_open: true })}
                variant="ghost"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleNewChat} className="w-full justify-start" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1"
              >
                <Filter className="h-3 w-3" />
                <span className="text-xs">Filtros</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
              </Button>

              {filterContext !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterContext('all')}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-1 p-2 border rounded">
                    <Button
                      variant={filterContext === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterContext('all')}
                      className="text-xs justify-start"
                    >
                      Todos
                    </Button>
                    {contextOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filterContext === option.value ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterContext(option.value as ContextType)}
                        className="text-xs justify-start"
                      >
                        <option.icon className="h-3 w-3 mr-1" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {!ui.sidebar_collapsed && (
                <div className="space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                  {searchTerm && (
                    <p className="text-xs">Tente ajustar os filtros de busca</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const contextOption = getContextOption(conversation.context)
                const isActive = activeConversationId === conversation.id

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative p-3 rounded-lg cursor-pointer transition-all hover:bg-accent",
                      isActive && "bg-accent border-l-4 border-l-primary"
                    )}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    {ui.sidebar_collapsed ? (
                      <div className="flex flex-col items-center space-y-1">
                        <contextOption.icon className="h-5 w-5" />
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium truncate flex-1 mr-2">
                            {conversation.title || 'Nova Conversa'}
                          </h3>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" />
                                Arquivar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <ClientTime date={conversation.updated_at} />
                          </span>

                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className={cn("text-xs", contextOption.color)}>
                              <contextOption.icon className="h-3 w-3 mr-1" />
                              {contextOption.label}
                            </Badge>

                            {conversation.messages && conversation.messages.length > 0 && (
                              <span className="text-xs bg-muted px-1 rounded">
                                {conversation.messages.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {conversation.messages && conversation.messages.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {conversation.messages[conversation.messages.length - 1]?.content}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!ui.sidebar_collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {filteredConversations.length} de {conversations.length} conversas
          </div>
        </div>
      )}
    </div>
  )
}