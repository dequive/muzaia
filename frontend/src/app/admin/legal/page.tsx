
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Upload, Shield, CheckCircle, XCircle, 
  Clock, Search, Filter, Eye, Download, AlertTriangle,
  BarChart3, BookOpen, Gavel, Users
} from 'lucide-react'

interface LegalDocument {
  id: string
  title: string
  official_number?: string
  document_type: string
  jurisdiction: string
  language: string
  status: string
  publication_date?: string
  effective_date?: string
  legal_areas: string[]
  keywords: string[]
  validated_at?: string
  created_at: string
  ai_query_count: string
  is_active: boolean
  can_be_referenced: boolean
  summary?: string
  validation_notes?: string
}

interface RepositoryStats {
  by_status: Record<string, number>
  by_type: Record<string, number>
  by_jurisdiction: Record<string, number>
  total_documents: number
  active_documents: number
  pending_validation: number
}

export default function LegalRepositoryPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [stats, setStats] = useState<RepositoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    official_number: '',
    document_type: 'law',
    jurisdiction: 'mozambique',
    language: 'pt',
    publication_date: '',
    effective_date: '',
    legal_areas: '',
    keywords: '',
    summary: '',
    upload_notes: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar documentos
      const docsResponse = await fetch('http://localhost:8000/api/legal/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData.documents || [])
      }

      // Carregar estatísticas
      const statsResponse = await fetch('http://localhost:8000/api/legal/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error loading legal repository data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Selecione um arquivo')
      return
    }

    try {
      setIsUploading(true)
      
      const formData = new FormData()
      Object.entries(uploadForm).forEach(([key, value]) => {
        formData.append(key, value)
      })
      formData.append('document_file', selectedFile)

      const response = await fetch('http://localhost:8000/api/legal/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })

      if (response.ok) {
        alert('Documento enviado com sucesso!')
        setUploadForm({
          title: '',
          official_number: '',
          document_type: 'law',
          jurisdiction: 'mozambique',
          language: 'pt',
          publication_date: '',
          effective_date: '',
          legal_areas: '',
          keywords: '',
          summary: '',
          upload_notes: ''
        })
        setSelectedFile(null)
        loadData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Erro ao enviar documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleValidateDocument = async (documentId: string, notes?: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/legal/${documentId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ validation_notes: notes })
      })

      if (response.ok) {
        alert('Documento validado com sucesso!')
        loadData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error validating document:', error)
      alert('Erro ao validar documento')
    }
  }

  const handleRejectDocument = async (documentId: string, reason: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/legal/${documentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ rejection_reason: reason })
      })

      if (response.ok) {
        alert('Documento rejeitado')
        loadData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error rejecting document:', error)
      alert('Erro ao rejeitar documento')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; icon: any; label: string }> = {
      pending: { variant: 'default', icon: Clock, label: 'Pendente' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Aprovado' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeitado' },
      under_review: { variant: 'default', icon: Eye, label: 'Em Análise' }
    }

    const config = statusMap[status] || { variant: 'default', icon: AlertTriangle, label: status }
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.official_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando repositório legal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Repositório de Leis
        </h1>
        <div className="text-sm text-gray-500">
          Sistema de gestão e validação de documentos legais
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_documents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_validation}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_documents > 0 ? Math.round((stats.active_documents / stats.total_documents) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">📚 Documentos</TabsTrigger>
          <TabsTrigger value="upload">📤 Upload</TabsTrigger>
          <TabsTrigger value="validation">✅ Validação</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
        </TabsList>

        {/* Lista de Documentos */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Legais</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por título ou número oficial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="law">Lei</option>
                  <option value="decree">Decreto</option>
                  <option value="constitution">Constituição</option>
                  <option value="regulation">Regulamento</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doc.title}</h3>
                        {doc.official_number && (
                          <p className="text-sm text-gray-600">Nº {doc.official_number}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(doc.status)}
                          <Badge variant="outline">{doc.document_type}</Badge>
                          <Badge variant="outline">{doc.jurisdiction}</Badge>
                        </div>
                        {doc.summary && (
                          <p className="text-sm text-gray-700 mt-2">{doc.summary}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Criado: {new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>Consultas IA: {doc.ai_query_count}</span>
                          {doc.validated_at && (
                            <span>Validado: {new Date(doc.validated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleValidateDocument(doc.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Motivo da rejeição:')
                                if (reason) handleRejectDocument(doc.id, reason)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload de Documentos */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documento Legal</CardTitle>
              <p className="text-sm text-gray-600">
                Apenas documentos validados serão utilizados pela IA para responder consultas
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="official_number">Número Oficial</Label>
                    <Input
                      id="official_number"
                      value={uploadForm.official_number}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, official_number: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="document_type">Tipo de Documento *</Label>
                    <select
                      id="document_type"
                      value={uploadForm.document_type}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="law">Lei</option>
                      <option value="decree">Decreto</option>
                      <option value="constitution">Constituição</option>
                      <option value="regulation">Regulamento</option>
                      <option value="code">Código</option>
                      <option value="ordinance">Portaria</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="jurisdiction">Jurisdição *</Label>
                    <select
                      id="jurisdiction"
                      value={uploadForm.jurisdiction}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="mozambique">Moçambique</option>
                      <option value="portugal">Portugal</option>
                      <option value="brazil">Brasil</option>
                      <option value="angola">Angola</option>
                      <option value="other">Outra</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="publication_date">Data de Publicação</Label>
                    <Input
                      id="publication_date"
                      type="date"
                      value={uploadForm.publication_date}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, publication_date: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="effective_date">Data de Vigência</Label>
                    <Input
                      id="effective_date"
                      type="date"
                      value={uploadForm.effective_date}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, effective_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="legal_areas">Áreas Jurídicas (separadas por vírgula)</Label>
                  <Input
                    id="legal_areas"
                    value={uploadForm.legal_areas}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, legal_areas: e.target.value }))}
                    placeholder="civil, penal, laboral"
                  />
                </div>
                
                <div>
                  <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    value={uploadForm.keywords}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="contrato, responsabilidade, direitos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="summary">Resumo</Label>
                  <Textarea
                    id="summary"
                    value={uploadForm.summary}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="document_file">Arquivo do Documento *</Label>
                  <Input
                    id="document_file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: PDF, DOC, DOCX (máx. 50MB)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="upload_notes">Notas de Upload</Label>
                  <Textarea
                    id="upload_notes"
                    value={uploadForm.upload_notes}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, upload_notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validação */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Pendentes de Validação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(doc => doc.status === 'pending').map(doc => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-gray-600">{doc.document_type} • {doc.jurisdiction}</p>
                        {doc.summary && <p className="text-sm mt-2">{doc.summary}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Notas de validação (opcional):')
                            handleValidateDocument(doc.id, notes || undefined)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Motivo da rejeição:')
                            if (reason) handleRejectDocument(doc.id, reason)
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Documentos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center py-2">
                    <span className="capitalize">{status}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Documentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.entries(stats.by_type).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center py-2">
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
