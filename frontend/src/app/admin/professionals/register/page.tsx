
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, UserPlus } from 'lucide-react'

const specialties = [
  'general', 'criminal', 'civil', 'labor', 'family', 
  'commercial', 'tax', 'administrative', 'constitutional', 'environmental'
]

const jurisdictions = [
  'portugal', 'brazil', 'angola', 'mozambique', 'other'
]

export default function RegisterProfessional() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    jurisdiction: '',
    specialties: [] as string[],
    license_number: '',
    professional_bio: '',
    license_document: null as File | null
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Senhas não coincidem')
      return
    }
    
    if (formData.specialties.length === 0) {
      alert('Selecione pelo menos uma especialidade')
      return
    }
    
    setLoading(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('full_name', formData.full_name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('role', formData.role)
      formDataToSend.append('jurisdiction', formData.jurisdiction)
      formDataToSend.append('specialties', JSON.stringify(formData.specialties))
      formDataToSend.append('license_number', formData.license_number)
      formDataToSend.append('professional_bio', formData.professional_bio)
      
      if (formData.license_document) {
        formDataToSend.append('license_document', formData.license_document)
      }
      
      const response = await fetch('/api/v1/admin/professionals/register', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (response.ok) {
        alert('Profissional cadastrado com sucesso! Aguarde aprovação.')
        setFormData({
          full_name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          jurisdiction: '',
          specialties: [],
          license_number: '',
          professional_bio: '',
          license_document: null
        })
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.detail || 'Erro ao cadastrar profissional'}`)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cadastrar profissional')
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      })
    } else {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== specialty)
      })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Cadastrar Profissional Jurídico</CardTitle>
              <CardDescription>
                Cadastre um novo advogado ou técnico jurídico no sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Pessoais</h3>
              
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Informações Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Profissionais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Tipo de Profissional</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lawyer">Advogado</SelectItem>
                      <SelectItem value="legal_tech">Técnico Jurídico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="jurisdiction">Jurisdição</Label>
                  <Select value={formData.jurisdiction} onValueChange={(value) => setFormData({...formData, jurisdiction: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a jurisdição" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction} value={jurisdiction}>
                          {jurisdiction.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="license_number">Número de Licença/Registro (OAB, etc.)</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  placeholder="Ex: OAB/SP 123456"
                />
              </div>
              
              <div>
                <Label>Especialidades</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specialties.map(specialty => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                      />
                      <Label htmlFor={specialty} className="text-sm">
                        {specialty.replace('_', ' ').toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="professional_bio">Biografia Profissional</Label>
                <Textarea
                  id="professional_bio"
                  value={formData.professional_bio}
                  onChange={(e) => setFormData({...formData, professional_bio: e.target.value})}
                  placeholder="Descreva sua experiência profissional..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="license_document">Documento de Licença (PDF)</Label>
                <div className="mt-2">
                  <Input
                    id="license_document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({
                      ...formData, 
                      license_document: e.target.files ? e.target.files[0] : null
                    })}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cadastrando...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Profissional
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
