
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Eye, UserCheck, UserX, AlertTriangle, Users } from 'lucide-react'

interface Professional {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  jurisdiction: string
  specialties: string[]
  license_number?: string
  professional_bio?: string
  has_license_document: boolean
  current_load?: string
  total_cases?: string
  average_rating?: string
  last_activity?: string
  created_at: string
}

export default function ProfessionalsManagement() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [pendingProfessionals, setPendingProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const fetchProfessionals = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      
      // Buscar profissionais pendentes
      const pendingResponse = await fetch('/api/v1/admin/professionals/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingProfessionals(pendingData.data || [])
      }
      
      // Buscar todos os profissionais
      const allResponse = await fetch('/api/v1/admin/professionals/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (allResponse.ok) {
        const allData = await allResponse.json()
        setProfessionals(allData.data || [])
      }
      
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (professionalId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      
      const response = await fetch(`/api/v1/admin/professionals/${professionalId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        })
      })
      
      if (response.ok) {
        alert('Profissional aprovado com sucesso!')
        setAdminNotes('')
        fetchProfessionals()
      } else {
        alert('Erro ao aprovar profissional')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao aprovar profissional')
    }
  }

  const handleReject = async (professionalId: string) => {
    if (!actionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição')
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      
      const response = await fetch(`/api/v1/admin/professionals/${professionalId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: actionReason,
          admin_notes: adminNotes
        })
      })
      
      if (response.ok) {
        alert('Profissional rejeitado')
        setActionReason('')
        setAdminNotes('')
        fetchProfessionals()
      } else {
        alert('Erro ao rejeitar profissional')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao rejeitar profissional')
    }
  }

  const handleSuspend = async (professionalId: string) => {
    if (!actionReason.trim()) {
      alert('Por favor, informe o motivo da suspensão')
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      
      const response = await fetch(`/api/v1/admin/professionals/${professionalId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: actionReason,
          admin_notes: adminNotes
        })
      })
      
      if (response.ok) {
        alert('Profissional suspenso')
        setActionReason('')
        setAdminNotes('')
        fetchProfessionals()
      } else {
        alert('Erro ao suspender profissional')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao suspender profissional')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
      blocked: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      lawyer: 'bg-blue-100 text-blue-800',
      legal_tech: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      staff: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  useEffect(() => {
    fetchProfessionals()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestão de Profissionais</h1>
        <p className="text-gray-600">Gerencie advogados e técnicos jurídicos do sistema</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <UserCheck className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold">
                {professionals.filter(p => p.status === 'approved').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold">{pendingProfessionals.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <UserX className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Rejeitados</p>
              <p className="text-2xl font-bold">
                {professionals.filter(p => p.status === 'rejected').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{professionals.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pendentes de Aprovação ({pendingProfessionals.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos os Profissionais ({professionals.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {pendingProfessionals.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-gray-500">Nenhum profissional pendente de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            pendingProfessionals.map((professional) => (
              <Card key={professional.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{professional.full_name}</CardTitle>
                      <CardDescription>{professional.email}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getRoleBadge(professional.role)}
                      {getStatusBadge(professional.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p><strong>Jurisdição:</strong> {professional.jurisdiction}</p>
                      <p><strong>Especialidades:</strong> {professional.specialties.join(', ')}</p>
                      {professional.license_number && (
                        <p><strong>Número de Licença:</strong> {professional.license_number}</p>
                      )}
                    </div>
                    <div>
                      <p><strong>Data de Cadastro:</strong> {new Date(professional.created_at).toLocaleDateString()}</p>
                      <p><strong>Documento de Licença:</strong> {professional.has_license_document ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                  
                  {professional.professional_bio && (
                    <div className="mb-4">
                      <p><strong>Bio Profissional:</strong></p>
                      <p className="text-sm text-gray-600 mt-1">{professional.professional_bio}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Aprovar Profissional</AlertDialogTitle>
                          <AlertDialogDescription>
                            Confirma a aprovação de {professional.full_name}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            placeholder="Notas administrativas (opcional)"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleApprove(professional.id)}>
                            Aprovar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rejeitar Profissional</AlertDialogTitle>
                          <AlertDialogDescription>
                            Confirma a rejeição de {professional.full_name}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            placeholder="Motivo da rejeição (obrigatório)"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            required
                          />
                          <Textarea
                            placeholder="Notas administrativas (opcional)"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReject(professional.id)}>
                            Rejeitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {professionals.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-gray-500">Nenhum profissional cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            professionals.map((professional) => (
              <Card key={professional.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{professional.full_name}</CardTitle>
                      <CardDescription>{professional.email}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getRoleBadge(professional.role)}
                      {getStatusBadge(professional.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p><strong>Especialidades:</strong> {professional.specialties.join(', ')}</p>
                      <p><strong>Jurisdição:</strong> {professional.jurisdiction}</p>
                    </div>
                    <div>
                      {professional.current_load && (
                        <p><strong>Carga Atual:</strong> {professional.current_load}</p>
                      )}
                      {professional.total_cases && (
                        <p><strong>Casos Totais:</strong> {professional.total_cases}</p>
                      )}
                    </div>
                    <div>
                      {professional.average_rating && (
                        <p><strong>Avaliação Média:</strong> {professional.average_rating}</p>
                      )}
                      {professional.last_activity && (
                        <p><strong>Última Atividade:</strong> {new Date(professional.last_activity).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  {professional.status === 'approved' && (
                    <div className="flex gap-2 mt-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Suspender
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suspender Profissional</AlertDialogTitle>
                            <AlertDialogDescription>
                              Confirma a suspensão de {professional.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-4 py-4">
                            <Textarea
                              placeholder="Motivo da suspensão (obrigatório)"
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              required
                            />
                            <Textarea
                              placeholder="Notas administrativas (opcional)"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSuspend(professional.id)}>
                              Suspender
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
