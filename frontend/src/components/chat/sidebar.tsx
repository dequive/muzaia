'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  MessageSquare,
  Settings,
  User,
  Trash2,
  Edit3,
  LogOut,
  LogIn,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  timestamp: string
}

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const { user, signOut } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Conversa atual',
      lastMessage: 'Olá! Como posso ajudar?',
      timestamp: new Date().toISOString(),
    }
  ])

  const handleNewChat = () => {
    // Add new chat logic here
    console.log('New chat started')
  }

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id))
  }

  return (
    <div className={cn("w-80 bg-gray-900 text-white flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold">Mozaia AI</h1>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-sm text-gray-400 mb-2 px-2">Conversas Recentes</div>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onDelete={handleDeleteConversation}
              />
            ))}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.email}
                </div>
                <div className="text-xs text-gray-400">Online</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Fazer Login
          </Button>
        )}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  onDelete: (id: string) => void
}

function ConversationItem({ conversation, onDelete }: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="group p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-100 truncate">
            {conversation.title}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(conversation.timestamp).toLocaleDateString()}
          </div>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-1"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(conversation.id)
                }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}