
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Phone,
  MessageSquare,
  Calendar,
  Star,
  User,
  Shield,
  Gavel,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

type HandoffStatus = 'idle' | 'requesting' | 'pending' | 'accepted' | 'completed'

interface HandoffControlsProps {
  conversationId: string
  userId: string
  onHandoffStatusChange?: (status: HandoffStatus) => void
}

const specializations = [
  { value: 'general', label: 'Geral', icon: MessageSquare },
  { value: 'criminal', label: 'Criminal', icon: Shield },
  { value: 'civil', label: 'Civil', icon: Gavel },
  { value: 'labor', label: 'Trabalhista', icon: User },
  { value: 'family', label: 'Família', icon: User },
  { value: 'commercial', label: 'Comercial', icon: MessageSquare },
]

export function HandoffControls({ 
  conversationId, 
  userId, 
  onHandoffStatusChange 
}: HandoffControlsProps) {
  const [status, setStatus] = useState<HandoffStatus>('idle')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedSpecialization, setSelectedSpecialization] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [reason, setReason] = useState('')
  const [technicianInfo, setTechnicianInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/handoff/ws/user/${userId}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'handoff_accepted':
          setStatus('accepted')
          setTechnicianInfo({
            name: data.technician_name,
            id: data.technician_id
          })
          toast.success(`${data.technician_name} entrou na conversa`)
          break
        case 'handoff_completed':
          setStatus('completed')
          toast.success('Atendimento finalizado')
          break
        case 'handoff_timeout':
          setStatus('idle')
          toast.error('Nenhum técnico disponível no momento')
          break
      }
      
      onHandoffStatusChange?.(status)
    }
    
    return () => ws.close()
  }, [userId, status, onHandoffStatusChange])

  const handleRequestHandoff = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, descreva o motivo da solicitação')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/smart-chat/conversation/' + conversationId + '/force-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          specialization: selectedSpecialization,
          reason: reason.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setStatus('pending')
        setShowRequestForm(false)
        toast.success('Procurando técnico disponível...')
      } else {
        toast.error('Erro ao solicitar atendimento')
      }
    } catch (error) {
      console.error('Error requesting handoff:', error)
      toast.error('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRequest = () => {
    setStatus('idle')
    setShowRequestForm(false)
    setReason('')
    toast.info('Solicitação cancelada')
  }

  const renderStatusIndicator = () => {
    switch (status) {
      case 'idle':
        return (
          <Button
            onClick={() => setShowRequestForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Falar com Especialista</span>
          </Button>
        )
      
      case 'requesting':
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Procurando técnico...</span>
            <Button
              onClick={handleCancelRequest}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              Cancelar
            </Button>
          </div>
        )
      
      case 'accepted':
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Técnico Conectado
            </Badge>
            {technicianInfo && (
              <span className="text-sm font-medium">{technicianInfo.name}</span>
            )}
          </div>
        )
      
      case 'completed':
        return (
          <Badge variant="outline" className="text-gray-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Atendimento Finalizado
          </Badge>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="border-b border-gray-200 p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {renderStatusIndicator()}
        </div>
        
        {status === 'accepted' && technicianInfo && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Avalie o atendimento ao final</span>
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      <AnimatePresence>
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span>Solicitar Atendimento Especializado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Área de Especialização
                  </label>
                  <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec) => (
                        <SelectItem key={spec.value} value={spec.value}>
                          <div className="flex items-center space-x-2">
                            <spec.icon className="h-4 w-4" />
                            <span>{spec.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Prioridade
                  </label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Motivo da Solicitação *
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Descreva brevemente o motivo pelo qual precisa falar com um especialista..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Como funciona:</p>
                      <ul className="mt-1 space-y-1 text-blue-700">
                        <li>• Técnicos especializados serão notificados</li>
                        <li>• Tempo de resposta: geralmente 2-5 minutos</li>
                        <li>• Todo o histórico da conversa será compartilhado</li>
                        <li>• O atendimento é gratuito para utilizadores registados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={handleRequestHandoff}
                    disabled={isLoading || !reason.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Phone className="h-4 w-4 mr-2" />
                    )}
                    Solicitar Atendimento
                  </Button>
                  <Button
                    onClick={() => setShowRequestForm(false)}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
