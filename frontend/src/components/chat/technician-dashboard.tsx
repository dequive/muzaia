
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
  specialization: string
  priority: 'normal' | 'high' | 'urgent'
  reason: string
  summary: string
  created_at: string
  waiting_time: string
}

interface TechnicianDashboardProps {
  technicianId: string
  technicianName: string
}

const priorityColors = {
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
}

const statusOptions = [
  { value: 'online', label: 'Online', color: 'green' },
  { value: 'busy', label: 'Ocupado', color: 'yellow' },
  { value: 'away', label: 'Ausente', color: 'orange' },
  { value: 'offline', label: 'Offline', color: 'gray' },
]

export function TechnicianDashboard({ technicianId, technicianName }: TechnicianDashboardProps) {
  const [status, setStatus] = useState<string>('online')
  const [pendingRequests, setPendingRequests] = useState<HandoffRequest[]>([])
  const [activeConversations, setActiveConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<HandoffRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [autoAccept, setAutoAccept] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/handoff/ws/technician/${technicianId}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'new_handoff_request':
          setPendingRequests(prev => [data, ...prev])
          if (notificationsEnabled) {
            toast.success(`Nova solicitação: ${data.specialization}`)
            // Play notification sound
            new Audio('/sounds/notification.mp3').play().catch(() => {})
          }
          break
        case 'handoff_cancelled':
          setPendingRequests(prev => prev.filter(r => r.id !== data.handoff_id))
          break
      }
    }
    
    ws.onopen = () => {
      // Send initial status
      ws.send(JSON.stringify({ type: 'status_update', status }))
    }
    
    return () => ws.close()
  }, [technicianId, status, notificationsEnabled])

  // Load pending requests
  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      const response = await fetch(`/api/handoff/pending?technician_id=${technicianId}`)
      const data = await response.json()
      if (data.success) {
        setPendingRequests(data.handoffs)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch('/api/handoff/technician/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: technicianId,
          status: newStatus
        })
      })

      if (response.ok) {
        setStatus(newStatus)
        toast.success(`Status alterado para ${newStatus}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/handoff/accept/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_id: technicianId })
      })

      const data = await response.json()
      if (data.success) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId))
        toast.success('Solicitação aceita!')
        // Add to active conversations
        loadActiveConversations()
      } else {
        toast.error('Erro ao aceitar solicitação')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteConversation = async (handoffId: string, rating?: number) => {
    try {
      const response = await fetch(`/api/handoff/complete/${handoffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          rating
        })
      })

      if (response.ok) {
        toast.success('Atendimento finalizado')
        setNotes('')
        loadActiveConversations()
      }
    } catch (error) {
      console.error('Error completing conversation:', error)
      toast.error('Erro ao finalizar atendimento')
    }
  }

  const loadActiveConversations = async () => {
    // TODO: Implement API to get active conversations
  }

  const formatWaitingTime = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Agora mesmo'
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Técnico</h1>
          <p className="text-gray-600">Bem-vindo, {technicianName}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Status Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        option.color === 'green' && 'bg-green-500',
                        option.color === 'yellow' && 'bg-yellow-500',
                        option.color === 'orange' && 'bg-orange-500',
                        option.color === 'gray' && 'bg-gray-500'
                      )} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
            <span className="text-sm">Notificações</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{activeConversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">12m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avaliação</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Solicitações Pendentes</span>
            <Badge variant="secondary">{pendingRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={priorityColors[request.priority]}>
                          {request.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{request.specialization}</Badge>
                        <span className="text-sm text-gray-500">
                          Aguardando há {formatWaitingTime(request.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1">
                        Usuário: {request.user_name || 'Anônimo'}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Motivo:</strong> {request.reason}
                      </p>
                      
                      {request.summary && (
                        <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                          <strong>IA Resume:</strong> {request.summary}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={isLoading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
