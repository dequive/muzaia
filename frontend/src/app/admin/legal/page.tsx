
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
  Clock, Search, Filter, Eye, Download, AlertTriangle 
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
      const docsResponse = await fetch('http://localhost:8000/api/legal/documents')
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData.documents || [])
      }

      // Carregar estatísticas
      const statsResponse = await fetch('http://localhost:8000/api/legal/stats')
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
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        alert('Documento carregado com sucesso!')
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
        alert('Erro ao carregar documento')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Erro ao carregar documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleValidation = async (documentId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const formData = new FormData()
      formData.append('action', action)
      if (notes) formData.append('validation_notes', notes)

      const response = await fetch(`http://localhost:8000/api/legal/documents/${documentId}/validate`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        alert(`Documento ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`)
        loadData()
      } else {
        alert('Erro na validação')
      }
    } catch (error) {
      console.error('Error validating document:', error)
      alert('Erro na validação')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', label: 'Pendente', icon: Clock },
      approved: { color: 'bg-green-500', label: 'Aprovado', icon: CheckCircle },
      rejected: { color: 'bg-red-500', label: 'Rejeitado', icon: XCircle },
      under_review: { color: 'bg-blue-500', label: 'Em Revisão', icon: Eye }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.official_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Carregando repositório legal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Repositório Jurídico
          </h1>
          <p className="text-gray-600">
            Gestão centralizada de documentos legais para consulta da IA
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Documentos</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Documentos Ativos</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.active_documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.pending_validation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Disponíveis para IA</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {documents.filter(d => d.can_be_referenced).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="pending">Validação</TabsTrigger>
          </TabsList>

          {/* Lista de Documentos */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos Legais
                </CardTitle>
                
                {/* Filtros */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por título ou número oficial..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="constitution">Constituição</option>
                    <option value="law">Lei</option>
                    <option value="decree">Decreto</option>
                    <option value="regulation">Regulamento</option>
                  </select>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                            {getStatusBadge(doc.status)}
                            {doc.can_be_referenced && (
                              <Badge className="bg-green-100 text-green-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Disponível para IA
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            {doc.official_number && (
                              <p><strong>Nº Oficial:</strong> {doc.official_number}</p>
                            )}
                            <p><strong>Tipo:</strong> {doc.document_type} | <strong>Jurisdição:</strong> {doc.jurisdiction}</p>
                            <p><strong>Áreas:</strong> {doc.legal_areas.join(', ') || 'Não especificadas'}</p>
                            <p><strong>Consultas da IA:</strong> {doc.ai_query_count}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {doc.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleValidation(doc.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const notes = prompt('Motivo da rejeição:')
                                  if (notes) handleValidation(doc.id, 'reject', notes)
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredDocuments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum documento encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload de Documento */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Documento Legal
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título do Documento *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="official_number">Número Oficial</Label>
                      <Input
                        id="official_number"
                        value={uploadForm.official_number}
                        onChange={(e) => setUploadForm({...uploadForm, official_number: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="document_type">Tipo de Documento *</Label>
                      <select
                        id="document_type"
                        value={uploadForm.document_type}
                        onChange={(e) => setUploadForm({...uploadForm, document_type: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="law">Lei</option>
                        <option value="constitution">Constituição</option>
                        <option value="code">Código</option>
                        <option value="decree">Decreto</option>
                        <option value="regulation">Regulamento</option>
                        <option value="ordinance">Portaria</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="jurisdiction">Jurisdição *</Label>
                      <select
                        id="jurisdiction"
                        value={uploadForm.jurisdiction}
                        onChange={(e) => setUploadForm({...uploadForm, jurisdiction: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="mozambique">Moçambique</option>
                        <option value="maputo">Maputo</option>
                        <option value="gaza">Gaza</option>
                        <option value="inhambane">Inhambane</option>
                        <option value="sofala">Sofala</option>
                        <option value="manica">Manica</option>
                        <option value="tete">Tete</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="publication_date">Data de Publicação</Label>
                      <Input
                        id="publication_date"
                        type="date"
                        value={uploadForm.publication_date}
                        onChange={(e) => setUploadForm({...uploadForm, publication_date: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="effective_date">Data de Vigência</Label>
                      <Input
                        id="effective_date"
                        type="date"
                        value={uploadForm.effective_date}
                        onChange={(e) => setUploadForm({...uploadForm, effective_date: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="legal_areas">Áreas Legais (separadas por vírgula)</Label>
                      <Input
                        id="legal_areas"
                        placeholder="civil, penal, laboral"
                        value={uploadForm.legal_areas}
                        onChange={(e) => setUploadForm({...uploadForm, legal_areas: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                      <Input
                        id="keywords"
                        placeholder="contrato, responsabilidade, direitos"
                        value={uploadForm.keywords}
                        onChange={(e) => setUploadForm({...uploadForm, keywords: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="summary">Resumo do Documento</Label>
                    <Textarea
                      id="summary"
                      rows={3}
                      value={uploadForm.summary}
                      onChange={(e) => setUploadForm({...uploadForm, summary: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="upload_notes">Notas do Upload</Label>
                    <Textarea
                      id="upload_notes"
                      rows={2}
                      value={uploadForm.upload_notes}
                      onChange={(e) => setUploadForm({...uploadForm, upload_notes: e.target.value})}
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
                    <p className="text-sm text-gray-500 mt-1">
                      Formatos aceitos: PDF, DOC, DOCX
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={isUploading} className="w-full">
                    {isUploading ? 'Carregando...' : 'Carregar Documento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos Pendentes de Validação */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Documentos Pendentes de Validação
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {documents.filter(doc => doc.status === 'pending').map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {doc.official_number && (
                              <p><strong>Nº Oficial:</strong> {doc.official_number}</p>
                            )}
                            <p><strong>Tipo:</strong> {doc.document_type} | <strong>Jurisdição:</strong> {doc.jurisdiction}</p>
                            <p><strong>Carregado em:</strong> {new Date(doc.created_at).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleValidation(doc.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const notes = prompt('Motivo da rejeição:')
                              if (notes) handleValidation(doc.id, 'reject', notes)
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {documents.filter(doc => doc.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum documento pendente de validação</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
