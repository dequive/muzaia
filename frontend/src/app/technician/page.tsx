
'use client'

import { useState, useEffect } from 'react'
import { TechnicianDashboard } from '@/components/chat/technician-dashboard'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserCheck, Shield, AlertTriangle } from 'lucide-react'

export default function TechnicianPage() {
  const { user } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [technicianId, setTechnicianId] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')

  // Mock authentication - in production, use proper auth
  const handleLogin = () => {
    if (accessCode === 'TECH2024' && technicianId.trim()) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Código de acesso ou ID inválido')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Portal do Técnico
              </h1>
              <p className="text-gray-600 mt-2">
                Acesso restrito para técnicos jurídicos
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="technicianId">ID do Técnico</Label>
                <Input
                  id="technicianId"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  placeholder="Digite seu ID"
                />
              </div>

              <div>
                <Label htmlFor="accessCode">Código de Acesso</Label>
                <Input
                  id="accessCode"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Código de acesso"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                onClick={handleLogin}
                className="w-full"
                disabled={!technicianId.trim() || !accessCode.trim()}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Demo - Use as credenciais:</p>
                <p>ID: qualquer valor</p>
                <p>Código: TECH2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechnicianDashboard 
        technicianId={technicianId}
        technicianName={user?.name || `Técnico ${technicianId}`}
      />
    </div>
  )
}
