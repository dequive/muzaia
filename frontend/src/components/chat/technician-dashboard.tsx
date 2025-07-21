
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Phone,
  Star,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  UserX,
  TrendingUp,
  Activity,
  Bell,
  Settings,
  Eye,
  FileText,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface HandoffRequest {
  id: string
  conversation_id: string
  user_name: string
  user_id: string
  specialization: string
  priority: 'normal' | 'high' | 'urgent'
  reason: string
  summary: string
  created_at: string
  waiting_time: string
  status: 'pending' | 'accepted' | 'completed'
}

interface ConversationHistory {
  id: string
  role: 'user' | 'assistant' | 'technician'
  content: string
  timestamp: string
  attachments?: Array<{ name: string, type: string, url: string }>
}

interface ActiveConversation {
  id: string
  user_name: string
  user_id: string
  started_at: string
  messages: ConversationHistory[]
  status: 'active' | 'paused' | 'completed'
  ai_suggestions?: string[]
}

export function TechnicianDashboard() {
  const [isOnline, setIsOnline] = useState(false)
  const [pendingHandoffs, setPendingHandoffs] = useState<HandoffRequest[]>([])
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialization, setFilterSpecialization] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  const [wsConnected, setWsConnected] = useState(false)
  const [stats, setStats] = useState({
    totalHandoffs: 0,
    completedToday: 0,
    averageResponseTime: '2.5 min',
    satisfaction: 4.8
  })

  // WebSocket connection
  useEffect(() => {
    const technicianId = 'tech_123' // Pegar do auth context
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/technician/${technicianId}`)
    
    ws.onopen = () => {
      setWsConnected(true)
      toast.success('Conectado ao sistema')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onclose = () => {
      setWsConnected(false)
      toast.error('Conexão perdida')
    }

    return () => ws.close()
  }, [])

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_handoff_request':
        const newRequest: HandoffRequest = {
          id: data.handoff_id,
          conversation_id: data.conversation_id,
          user_name: data.user_name || 'Usuário Anônimo',
          user_id: data.user_id,
          specialization: data.specialization,
          priority: data.priority,
          reason: data.reason,
          summary: data.summary,
          created_at: data.created_at,
          waiting_time: '0 min',
          status: 'pending'
        }
        setPendingHandoffs(prev => [newRequest, ...prev])
        
        // Notification sound and toast
        new Audio('/sounds/notification.mp3').play().catch(() => {})
        toast.success(`Nova solicitação: ${data.specialization}`, {
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => handleAcceptHandoff(newRequest)
          }
        })
        break

      case 'new_message':
        if (data.sender_type !== 'technician') {
          setActiveConversations(prev => 
            prev.map(conv => 
              conv.id === data.conversation_id 
                ? {
                    ...conv,
                    messages: [...conv.messages, {
                      id: Date.now().toString(),
                      role: data.sender_type,
                      content: data.content,
                      timestamp: data.timestamp
                    }]
                  }
                : conv
            )
          )
        }
        break

      case 'conversation_ended':
        setActiveConversations(prev => 
          prev.filter(conv => conv.id !== data.conversation_id)
        )
        toast.info('Conversa finalizada')
        break
    }
  }

  const handleToggleOnline = async (online: boolean) => {
    setIsOnline(online)
    
    try {
      await fetch('/api/technician/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: online ? 'online' : 'offline',
          technician_id: 'tech_123'
        })
      })

      toast.success(online ? 'Você está disponível' : 'Você está offline')
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleAcceptHandoff = async (request: HandoffRequest) => {
    try {
      const response = await fetch(`/api/handoff/${request.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: 'tech_123'
        })
      })

      if (response.ok) {
        // Move from pending to active
        setPendingHandoffs(prev => prev.filter(h => h.id !== request.id))
        
        // Add to active conversations
        const newConversation: ActiveConversation = {
          id: request.conversation_id,
          user_name: request.user_name,
          user_id: request.user_id,
          started_at: new Date().toISOString(),
          messages: [{
            id: Date.now().toString(),
            role: 'assistant',
            content: request.summary,
            timestamp: new Date().toISOString()
          }],
          status: 'active',
          ai_suggestions: [
            'Solicite mais detalhes sobre o caso',
            'Pergunte sobre documentos relevantes',
            'Esclareça o objetivo da consulta'
          ]
        }
        
        setActiveConversations(prev => [...prev, newConversation])
        setSelectedConversation(request.conversation_id)
        
        toast.success(`Atendimento iniciado com ${request.user_name}`)
      }
    } catch (error) {
      toast.error('Erro ao aceitar atendimento')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message = {
      id: Date.now().toString(),
      role: 'technician' as const,
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    // Add to local state immediately
    setActiveConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    )

    setNewMessage('')

    try {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          content: newMessage,
          sender_type: 'technician',
          sender_id: 'tech_123'
        })
      })
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  const filteredHandoffs = pendingHandoffs.filter(handoff => {
    const matchesSearch = handoff.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         handoff.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialization = filterSpecialization === 'all' || handoff.specialization === filterSpecialization
    const matchesPriority = filterPriority === 'all' || handoff.priority === filterPriority
    
    return matchesSearch && matchesSpecialization && matchesPriority
  })

  const selectedConv = activeConversations.find(conv => conv.id === selectedConversation)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-500 text-white">TJ</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">Dr. João Silva</h3>
                <p className="text-sm text-gray-500">Advogado - OAB/MZ 12345</p>
              </div>
            </div>
            <div className={cn(
              "w-3 h-3 rounded-full",
              wsConnected ? "bg-green-400" : "bg-red-400"
            )} />
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {isOnline ? 'Disponível' : 'Offline'}
              </span>
            </div>
            <Switch 
              checked={isOnline} 
              onCheckedChange={handleToggleOnline}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.totalHandoffs}</div>
              <div className="text-xs text-blue-500">Atendimentos</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.completedToday}</div>
              <div className="text-xs text-green-500">Hoje</div>
            </div>
          </div>
        </div>

        {/* Pending Handoffs */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Solicitações ({filteredHandoffs.length})
              </h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('/test', '_blank')}
                title="Testes do Sistema"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="space-y-2 mb-4">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
              <div className="flex space-x-2">
                <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="labor">Trabalhista</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Handoff Requests */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {filteredHandoffs.map((handoff) => (
                <motion.div
                  key={handoff.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {handoff.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {handoff.user_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {handoff.waiting_time} • {handoff.specialization}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={handoff.priority === 'urgent' ? 'destructive' : 
                               handoff.priority === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {handoff.priority}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {handoff.reason}
                  </p>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => handleAcceptHandoff(handoff)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Aceitar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConv.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConv.user_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ativo desde {new Date(selectedConv.started_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Ativo
                  </Badge>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Resumo
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConv.messages.map((message) => (
                <div 
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'technician' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "max-w-xs lg:max-w-md p-3 rounded-lg",
                    message.role === 'technician' 
                      ? 'bg-blue-500 text-white' 
                      : message.role === 'user'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  )}>
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.role === 'technician' ? 'text-blue-100' : 'text-gray-500'
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Suggestions */}
            {selectedConv.ai_suggestions && selectedConv.ai_suggestions.length > 0 && (
              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <p className="text-xs font-medium text-blue-800 mb-2">
                  💡 Sugestões da IA:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedConv.ai_suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-white border-blue-200 hover:bg-blue-50"
                      onClick={() => setNewMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma conversa selecionada
              </h3>
              <p className="text-gray-500">
                Aceite uma solicitação para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Conversations List */}
      {activeConversations.length > 0 && (
        <div className="w-64 bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Ativos ({activeConversations.length})
            </h4>
          </div>
          <div className="overflow-y-auto">
            {activeConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={cn(
                  "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50",
                  selectedConversation === conv.id && "bg-blue-50 border-blue-200"
                )}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {conv.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {conv.user_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {conv.messages.length} mensagens
                    </div>
                  </div>
                </div>
                {conv.messages.length > 0 && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {conv.messages[conv.messages.length - 1].content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
