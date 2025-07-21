
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
  BookOpen, Plus, Search, Filter, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, BarChart3, Tags,
  BookMarked, FileText, Settings, Users, Globe
} from 'lucide-react'

interface GlossarioTermo {
  id: string
  termo: string
  definicao: string
  categoria: string
  nivel_tecnico: string
  exemplo?: string
  sinonimos: string[]
  jurisdicao: string
  idioma: string
  versao: string
  status: string
  revisado_por?: string
  data_revisao: string
  created_at: string
  updated_at: string
  is_active: boolean
  tags: string[]
  metadados: Record<string, any>
}

interface GlossarioStats {
  total_termos: number
  por_categoria: Record<string, number>
  por_nivel: Record<string, number>
  por_status: Record<string, number>
  por_jurisdicao: Record<string, number>
}

const categorias = [
  { value: 'direito_constitucional', label: 'Direito Constitucional' },
  { value: 'direito_penal', label: 'Direito Penal' },
  { value: 'direito_civil', label: 'Direito Civil' },
  { value: 'direito_comercial', label: 'Direito Comercial' },
  { value: 'direito_administrativo', label: 'Direito Administrativo' },
  { value: 'direito_trabalho', label: 'Direito do Trabalho' },
  { value: 'direito_tributario', label: 'Direito Tributário' },
  { value: 'processo_civil', label: 'Processo Civil' },
  { value: 'processo_penal', label: 'Processo Penal' },
]

const niveistecnicos = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'validado', label: 'Validado', color: 'bg-green-100 text-green-800' },
  { value: 'revogado', label: 'Revogado', color: 'bg-red-100 text-red-800' },
]

export default function GlossarioPage() {
  const [termos, setTermos] = useState<GlossarioTermo[]>([])
  const [stats, setStats] = useState<GlossarioStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [filtroNivel, setFiltroNivel] = useState('all')
  const [selectedTermo, setSelectedTermo] = useState<GlossarioTermo | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Formulário para novo termo
  const [novoTermo, setNovoTermo] = useState({
    termo: '',
    definicao: '',
    categoria: 'direito_civil',
    nivel_tecnico: 'basico',
    exemplo: '',
    sinonimos: '',
    jurisdicao: 'mozambique',
    idioma: 'pt',
    tags: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    carregarDados()
  }, [currentPage, searchTerm, filtroCategoria, filtroStatus, filtroNivel])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      // Carregar termos
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (searchTerm) params.append('query', searchTerm)
      if (filtroCategoria !== 'all') params.append('categoria', filtroCategoria)
      if (filtroStatus !== 'all') params.append('status', filtroStatus)
      if (filtroNivel !== 'all') params.append('nivel_tecnico', filtroNivel)

      const [termosResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/glossario/?${params}`),
        fetch('http://localhost:8000/api/glossario/stats/overview')
      ])

      if (termosResponse.ok && statsResponse.ok) {
        const termosData = await termosResponse.json()
        const statsData = await statsResponse.json()
        
        setTermos(termosData.items)
        setTotalPages(termosData.pages)
        setStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const criarTermo = async () => {
    try {
      const termoData = {
        ...novoTermo,
        sinonimos: novoTermo.sinonimos.split(',').map(s => s.trim()).filter(s => s),
        tags: novoTermo.tags.split(',').map(s => s.trim()).filter(s => s)
      }

      const response = await fetch('http://localhost:8000/api/glossario/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termoData)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNovoTermo({
          termo: '',
          definicao: '',
          categoria: 'direito_civil',
          nivel_tecnico: 'basico',
          exemplo: '',
          sinonimos: '',
          jurisdicao: 'mozambique',
          idioma: 'pt',
          tags: ''
        })
        carregarDados()
      }
    } catch (error) {
      console.error('Erro ao criar termo:', error)
    }
  }

  const validarTermo = async (termoId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/glossario/${termoId}?revisor=admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'validado' })
      })

      if (response.ok) {
        carregarDados()
      }
    } catch (error) {
      console.error('Erro ao validar termo:', error)
    }
  }

  const excluirTermo = async (termoId: string) => {
    if (confirm('Tem certeza que deseja excluir este termo?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/glossario/${termoId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          carregarDados()
        }
      } catch (error) {
        console.error('Erro ao excluir termo:', error)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const getCategoriaLabel = (categoria: string) => {
    return categorias.find(c => c.value === categoria)?.label || categoria
  }

  const getNivelLabel = (nivel: string) => {
    return niveistenicos.find(n => n.value === nivel)?.label || nivel
  }

  if (isLoading && termos.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando glossário...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Glossário Jurídico
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão do glossário de termos jurídicos do sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Termo
        </Button>
      </div>

      <Tabs defaultValue="termos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="termos" className="gap-2">
            <FileText className="h-4 w-4" />
            Termos
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba Termos */}
        <TabsContent value="termos" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar termos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todas as categorias</option>
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Status</Label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todos os status</option>
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Nível Técnico</Label>
                  <select
                    value={filtroNivel}
                    onChange={(e) => setFiltroNivel(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todos os níveis</option>
                    {niveistenicos.map(nivel => (
                      <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Termos */}
          <div className="grid gap-4">
            {termos.map((termo) => (
              <Card key={termo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{termo.termo}</h3>
                        {getStatusBadge(termo.status)}
                        <Badge variant="outline">{getCategoriaLabel(termo.categoria)}</Badge>
                        <Badge variant="secondary">{getNivelLabel(termo.nivel_tecnico)}</Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {termo.definicao}
                      </p>

                      {termo.sinonimos.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Sinônimos: {termo.sinonimos.join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Versão: {termo.versao}</span>
                        <span>Jurisdição: {termo.jurisdicao}</span>
                        {termo.revisado_por && (
                          <span>Revisado por: {termo.revisado_por}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTermo(termo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {termo.status === 'rascunho' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => validarTermo(termo.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirTermo(termo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              
              <span className="flex items-center px-4 py-2">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Termos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_termos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Por Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.por_status).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.por_categoria).slice(0, 5).map(([categoria, count]) => (
                    <div key={categoria} className="flex justify-between">
                      <span className="text-sm">{getCategoriaLabel(categoria)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Por Nível</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.por_nivel).map(([nivel, count]) => (
                    <div key={nivel} className="flex justify-between">
                      <span className="capitalize">{nivel}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Aba Configurações */}
        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Glossário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">
                Funcionalidades de configuração serão implementadas aqui:
              </div>
              <ul className="list-disc ml-6 space-y-1 text-sm text-muted-foreground">
                <li>Importação/Exportação de termos</li>
                <li>Configuração de categorias personalizadas</li>
                <li>Gestão de permissões de revisão</li>
                <li>Configuração de idiomas suportados</li>
                <li>Integração com busca semântica</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para criar novo termo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Termo do Glossário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Termo</Label>
                  <Input
                    value={novoTermo.termo}
                    onChange={(e) => setNovoTermo({...novoTermo, termo: e.target.value})}
                    placeholder="Ex: Habeas Corpus"
                  />
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <select
                    value={novoTermo.categoria}
                    onChange={(e) => setNovoTermo({...novoTermo, categoria: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Definição</Label>
                <Textarea
                  value={novoTermo.definicao}
                  onChange={(e) => setNovoTermo({...novoTermo, definicao: e.target.value})}
                  placeholder="Definição completa do termo..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Exemplo de Uso</Label>
                <Textarea
                  value={novoTermo.exemplo}
                  onChange={(e) => setNovoTermo({...novoTermo, exemplo: e.target.value})}
                  placeholder="Exemplo prático de como o termo é usado..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nível Técnico</Label>
                  <select
                    value={novoTermo.nivel_tecnico}
                    onChange={(e) => setNovoTermo({...novoTermo, nivel_tecnico: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    {niveistenicos.map(nivel => (
                      <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Jurisdição</Label>
                  <Input
                    value={novoTermo.jurisdicao}
                    onChange={(e) => setNovoTermo({...novoTermo, jurisdicao: e.target.value})}
                    placeholder="Ex: mozambique"
                  />
                </div>
              </div>

              <div>
                <Label>Sinônimos (separados por vírgula)</Label>
                <Input
                  value={novoTermo.sinonimos}
                  onChange={(e) => setNovoTermo({...novoTermo, sinonimos: e.target.value})}
                  placeholder="Ex: remédio constitucional, garantia de liberdade"
                />
              </div>

              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={novoTermo.tags}
                  onChange={(e) => setNovoTermo({...novoTermo, tags: e.target.value})}
                  placeholder="Ex: liberdade, prisão, constitucional"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={criarTermo}>
                  Criar Termo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para visualizar termo */}
      {selectedTermo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedTermo.termo}
                    {getStatusBadge(selectedTermo.status)}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{getCategoriaLabel(selectedTermo.categoria)}</Badge>
                    <Badge variant="secondary">{getNivelLabel(selectedTermo.nivel_tecnico)}</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTermo(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Definição</h4>
                <p className="text-muted-foreground">{selectedTermo.definicao}</p>
              </div>

              {selectedTermo.exemplo && (
                <div>
                  <h4 className="font-semibold mb-2">Exemplo de Uso</h4>
                  <p className="text-muted-foreground italic">"{selectedTermo.exemplo}"</p>
                </div>
              )}

              {selectedTermo.sinonimos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Sinônimos</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTermo.sinonimos.map((sinonimo, index) => (
                      <Badge key={index} variant="outline">{sinonimo}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTermo.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTermo.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-semibold mb-2">Metadados</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Versão: {selectedTermo.versao}</div>
                    <div>Jurisdição: {selectedTermo.jurisdicao}</div>
                    <div>Idioma: {selectedTermo.idioma}</div>
                    {selectedTermo.revisado_por && (
                      <div>Revisado por: {selectedTermo.revisado_por}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Datas</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Criado: {new Date(selectedTermo.created_at).toLocaleDateString()}</div>
                    <div>Atualizado: {new Date(selectedTermo.updated_at).toLocaleDateString()}</div>
                    <div>Revisão: {new Date(selectedTermo.data_revisao).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
