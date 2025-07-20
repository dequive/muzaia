// Chat sidebar component
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  MoreVertical,
  Trash2,
  Edit3,
  Archive,
  ChevronLeft,
  Filter,
  Clock,
  Star,
  Zap,
  Scale,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useChat } from '@/hooks/useChat'
import { useChatStore, chatActions } from '@/store'
import { useUIStore } from '@/store'
import { formatDate, formatRelativeTime, cn } from '@/lib/utils'
import type { Conversation, ContextType } from '@/types'

const contextIcons = {
  general: MessageSquare,
  technical: Zap,
  legal: Scale,
  business: Briefcase,
  academic: GraduationCap,
} as const

const contextColors = {
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  technical: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  legal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  academic: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}

export function Sidebar() {
  const router = useRouter()
  const { ui, updateUI } = useUIStore()
  const { 
    conversations, 
    currentConversation, 
    startNewChat, 
    selectConversation,
    loadingConversations 
  } = useChat()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterContext, setFilterContext] = useState<ContextType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Filtrar conversas
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterContext === 'all' || conv.context === filterContext
    return matchesSearch && matchesFilter
  })

  // Agrupar por data
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = new Date(conv.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let key: string
    if (date.toDateString() === today.toDateString()) {
      key = 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Ontem'
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      key = 'Esta semana'
    } else {
      key = 'Mais antigo'
    }

    if (!groups[key]) groups[key] = []
    groups[key].push(conv)
    return groups
  }, {} as Record<string, Conversation[]>)

  const handleNewChat = () => {
    startNewChat()
    if (ui.sidebar_collapsed) {
      updateUI({ sidebar_collapsed: false })
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    selectConversation(conversation)
    router.push('/chat')
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: ui.sidebar_collapsed ? 60 : 320,
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-muted/50 border-r border-border flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!ui.sidebar_collapsed && (
            <h2 className="text-lg font-semibold">Conversas</h2>
          )}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className={cn(
                "h-8 w-8",
                !ui.sidebar_collapsed && "h-9 px-3 w-auto"
              )}
            >
              <Plus className="h-4 w-4" />
              {!ui.sidebar_collapsed && <span className="ml-2">Nova</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateUI({ sidebar_collapsed: !ui.sidebar_collapsed })}
              className="h-8 w-8"
            >
              <ChevronLeft 
                className={cn(
                  "h-4 w-4 transition-transform",
                  ui.sidebar_collapsed && "rotate-180"
                )} 
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {!ui.sidebar_collapsed && (
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 px-2 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filtros
            </Button>
            {filterContext !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {filterContext}
                <button
                  onClick={() => setFilterContext('all')}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-2 gap-2"
              >
                {Object.entries(contextColors).map(([context, color]) => (
                  <Button
                    key={context}
                    variant={filterContext === context ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterContext(context as ContextType)}
                    className="h-8 text-xs justify-start"
                  >
                    <div className={cn("w-2 h-2 rounded-full mr-2", color)} />
                    {context}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loadingConversations ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedConversations).length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedConversations).map(([group, convs]) => (
              <div key={group} className="mb-4">
                {!ui.sidebar_collapsed && (
                  <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    {group}
                  </h3>
                )}
                <div className="space-y-1">
                  {convs.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={currentConversation?.id === conversation.id}
                      isCollapsed={ui.sidebar_collapsed}
                      onClick={() => handleSelectConversation(conversation)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      {!ui.sidebar_collapsed && (
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => updateUI({ chat_settings_open: true })}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      )}
    </motion.aside>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}

function ConversationItem({ 
  conversation, 
  isActive, 
  isCollapsed, 
  onClick 
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const ContextIcon = contextIcons[conversation.context] || MessageSquare

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implementar delete
    console.log('Delete conversation:', conversation.id)
  }

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implementar archive
    console.log('Archive conversation:', conversation.id)
  }

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implementar rename
    console.log('Rename conversation:', conversation.id)
  }

  if (isCollapsed) {
    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        onClick={onClick}
        className="w-full h-12 p-0 flex items-center justify-center"
        title={conversation.title}
      >
        <ContextIcon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-all hover:shadow-sm",
        isActive && "ring-2 ring-primary ring-opacity-20 bg-primary/5"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <ContextIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <h4 className="text-sm font-medium truncate">
              {conversation.title}
            </h4>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {isHydrated ? formatRelativeTime(conversation.updated_at) : formatDate(conversation.updated_at)}
            </span>

            <div className="flex items-center space-x-2">
              {conversation.avg_confidence && conversation.avg_confidence > 0.8 && (
                <Star className="h-3 w-3 text-yellow-500" />
              )}
              <Badge 
                variant="secondary" 
                className={cn("text-xs", contextColors[conversation.context])}
              >
                {conversation.message_count}
              </Badge>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleRename}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

// Export as ChatSidebar for backward compatibility
export { Sidebar as ChatSidebar }