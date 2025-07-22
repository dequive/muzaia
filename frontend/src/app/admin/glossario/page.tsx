'use client'

import { useState, useEffect } from 'react'
import { glossarioApi, checkApiHealth } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, Plus, Search, Filter, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, BarChart3, Tags,
  BookMarked, FileText, Settings, Users, Globe, Gavel, Scale
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
  lei_referencia?: string
  artigo_referencia?: string
  decreto_referencia?: string
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
  por_lei?: Record<string, number>
}

const CATEGORIAS_MOZAMBIQUE = [
  { value: 'direito_constitucional', label: 'Direito Constitucional' },
  { value: 'codigo_civil', label: 'Código Civil' },
  { value: 'codigo_penal', label: 'Código Penal' },
  { value: 'codigo_processo_civil', label: 'Código de Processo Civil' },
  { value: 'codigo_processo_penal', label: 'Código de Processo Penal' },
  { value: 'codigo_comercial', label: 'Código Comercial' },
  { value: 'direito_familia', label: 'Direito da Família' },
  { value: 'direito_trabalho', label: 'Direito do Trabalho' },
  { value: 'direito_administrativo', label: 'Direito Administrativo' },
  { value: 'direito_tributario', label: 'Direito Tributário' },
  { value: 'direito_terra', label: 'Direito da Terra' },
  { value: 'direito_mineiro', label: 'Direito Mineiro' },
  { value: 'direito_ambiental', label: 'Direito Ambiental' },
  { value: 'lei_investimento', label: 'Lei de Investimentos' },
  { value: 'lei_trabalho', label: 'Lei do Trabalho' },
  { value: 'lei_terras', label: 'Lei de Terras' },
  { value: 'lei_minas', label: 'Lei de Minas' },
  { value: 'lei_florestal', label: 'Lei Florestal' },
  { value: 'direito_costumeiro', label: 'Direito Costumeiro' }
]

const NIVEIS_TECNICOS = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' }
]

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho', icon: Clock, color: 'yellow' },
  { value: 'validado', label: 'Validado', icon: CheckCircle, color: 'green' },
  { value: 'revogado', label: 'Revogado', icon: XCircle, color: 'red' }
]

// Function to extract error message from API response
const getApiErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  } else if (error?.message) {
    return error.message;
  } else {
    return 'Ocorreu um erro inesperado.';
  }
};

export default function GlossarioPage() {
  const [termos, setTermos] = useState<GlossarioTermo[]>([])
  const [stats, setStats] = useState<GlossarioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedNivel, setSelectedNivel] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTermo, setEditingTermo] = useState<GlossarioTermo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Formulário state
  const [formData, setFormData] = useState({
    termo: '',
    definicao: '',
    categoria: '',
    nivel_tecnico: 'basico',
    exemplo: '',
    sinonimos: '',
    lei_referencia: '',
    artigo_referencia: '',
    decreto_referencia: '',
    tags: ''
  })

  const fetchTermos = async () => {
    try {
      setLoading(true)
      
      // First check if backend is reachable
      console.log('🔍 Tentando conectar ao backend em:', process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:8000')
      
      // Quick health check before making the actual request
      const healthCheck = await checkApiHealth()
      if (!healthCheck.isHealthy) {
        console.warn('⚠️ Backend não está saudável:', healthCheck.details)
        toast.error('Backend não está acessível. Verifique se está executando na porta 8000.')
        healthCheck.details.suggestions.forEach(suggestion => {
          toast.error(suggestion, { duration: 6000 })
        })
        return
      }
      
      const response = await glossarioApi.getTermos({
        page: currentPage,
        limit: 20,
        query: searchQuery || undefined,
        categoria: selectedCategoria || undefined,
        nivel_tecnico: selectedNivel || undefined,
        status: selectedStatus || undefined
      })

      setTermos(response.items || [])
      setTotalPages(response.pages || 1)
    } catch (error) {
      console.error('❌ Glossario API Error:', {
        error,
        type: typeof error,
        errorCode: error?.code,
        errorMessage: error?.message,
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
        isNetworkError: !error?.response,
        fullError: error
      })
      
      const errorMessage = getApiErrorMessage(error)
      toast.error(errorMessage)
      
      // If it's a network error, show additional help
      if (!error?.response) {
        toast.error('💡 Dica: Verifique se o backend está executando na porta 8000', {
          duration: 8000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await glossarioApi.getStats()
      setStats(response)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  useEffect(() => {
    fetchTermos()
  }, [currentPage, searchQuery, selectedCategoria, selectedNivel, selectedStatus])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        sinonimos: formData.sinonimos.split(',').map(s => s.trim()).filter(s => s),
        tags: formData.tags.split(',').map(s => s.trim()).filter(s => s)
      }

      if (editingTermo) {
        await glossarioApi.updateTermo(editingTermo.id, data)
        toast.success('Termo atualizado com sucesso!')
      } else {
        await glossarioApi.createTermo(data)
        toast.success('Termo criado com sucesso!')
      }

      setShowForm(false)
      setEditingTermo(null)
      setFormData({
        termo: '',
        definicao: '',
        categoria: '',
        nivel_tecnico: 'basico',
        exemplo: '',
        sinonimos: '',
        lei_referencia: '',
        artigo_referencia: '',
        decreto_referencia: '',
        tags: ''
      })
      await fetchTermos()
      await fetchStats()
    } catch (error) {
      const errorMessage = getApiErrorMessage(error)
      console.error('Erro ao salvar termo:', errorMessage)
      toast.error(`Erro ao salvar termo: ${errorMessage}`)
    }
  }

  const handleEdit = (termo: GlossarioTermo) => {
    setEditingTermo(termo)
    setFormData({
      termo: termo.termo,
      definicao: termo.definicao,
      categoria: termo.categoria,
      nivel_tecnico: termo.nivel_tecnico,
      exemplo: termo.exemplo || '',
      sinonimos: termo.sinonimos.join(', '),
      lei_referencia: termo.lei_referencia || '',
      artigo_referencia: termo.artigo_referencia || '',
      decreto_referencia: termo.decreto_referencia || '',
      tags: termo.tags.join(', ')
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este termo?')) return

    try {
      await glossarioApi.deleteTermo(id)
      toast.success('Termo excluído com sucesso!')
      await fetchTermos()
      await fetchStats()
    } catch (error) {
      console.error('Erro ao excluir termo:', error)
      toast.error('Erro ao excluir termo')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status)
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>

    const Icon = statusConfig.icon
    return (
      <Badge variant={statusConfig.color as any} className="flex items-center gap-1">
        <Icon size={12} />
        {statusConfig.label}
      </Badge>
    )
  }

  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_MOZAMBIQUE.find(c => c.value === categoria)
    return cat?.label || categoria
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Gavel className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Glossário Jurídico
            </h1>
            <p className="text-gray-600">
              Termos da legislação moçambicana - {stats?.total_termos || 0} termos registrados
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Adicionar Termo
        </Button>
      </div>

      <Tabs defaultValue="termos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="termos" className="flex items-center gap-2">
            <BookOpen size={16} />
            Termos
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center gap-2">
            <BarChart3 size={16} />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="legislacao" className="flex items-center gap-2">
            <Scale size={16} />
            Por Legislação
          </TabsTrigger>
        </TabsList>

        {/* Tab de Termos */}
        <TabsContent value="termos" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter size={18} />
                Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar termo</Label>
                  <Input
                    id="search"
                    placeholder="Digite para buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {CATEGORIAS_MOZAMBIQUE.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nivel">Nível Técnico</Label>
                  <Select value={selectedNivel} onValueChange={setSelectedNivel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os níveis</SelectItem>
                      {NIVEIS_TECNICOS.map(nivel => (
                        <SelectItem key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Termos */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">Carregando termos...</div>
                </CardContent>
              </Card>
            ) : termos.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    Nenhum termo encontrado
                  </div>
                </CardContent>
              </Card>
            ) : (
              termos.map((termo) => (
                <Card key={termo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {termo.termo}
                          </h3>
                          {getStatusBadge(termo.status)}
                          <Badge variant="outline">
                            {getCategoriaLabel(termo.categoria)}
                          </Badge>
                          <Badge variant="secondary">
                            {NIVEIS_TECNICOS.find(n => n.value === termo.nivel_tecnico)?.label}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{termo.definicao}</p>

                        {termo.exemplo && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-600">Exemplo: </span>
                            <span className="text-sm text-gray-700 italic">{termo.exemplo}</span>
                          </div>
                        )}

                        {(termo.lei_referencia || termo.artigo_referencia || termo.decreto_referencia) && (
                          <div className="mb-3 p-2 bg-blue-50 rounded">
                            <span className="text-sm font-medium text-blue-700">Referências Legais:</span>
                            <div className="text-sm text-blue-600">
                              {termo.lei_referencia && <div>Lei: {termo.lei_referencia}</div>}
                              {termo.artigo_referencia && <div>Artigo: {termo.artigo_referencia}</div>}
                              {termo.decreto_referencia && <div>Decreto: {termo.decreto_referencia}</div>}
                            </div>
                          </div>
                        )}

                        {termo.sinonimos.length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-600">Sinônimos: </span>
                            <span className="text-sm text-gray-700">
                              {termo.sinonimos.join(', ')}
                            </span>
                          </div>
                        )}

                        {termo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {termo.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tags size={10} className="mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(termo)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(termo.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 border-t pt-2">
                      Versão: {termo.versao} | 
                      Criado: {new Date(termo.created_at).toLocaleDateString('pt-BR')} |
                      {termo.revisado_por && ` Revisado por: ${termo.revisado_por}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
              <span className="flex items-center px-4">
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

        {/* Tab de Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Termos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.total_termos}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.por_categoria).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between">
                        <span className="text-sm">{getCategoriaLabel(cat)}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.por_status).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        {getStatusBadge(status)}
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab de Legislação */}
        <TabsContent value="legislacao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale size={18} />
                Termos por Legislação Moçambicana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Distribuição dos termos jurídicos por principais leis e códigos de Moçambique:
              </p>
              {stats?.por_lei && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats.por_lei).map(([lei, count]) => (
                    <div key={lei} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{lei}</span>
                      <Badge variant="outline">{count} termos}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTermo ? 'Editar Termo' : 'Adicionar Novo Termo'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="termo">Termo Jurídico*</Label>
                    <Input
                      id="termo"
                      required
                      value={formData.termo}
                      onChange={(e) => setFormData({...formData, termo: e.target.value})}
                      placeholder="Ex: DUAT, Lobolo, Autoridade Tradicional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria*</Label>
                    <select
                      id="categoria"
                      required
                      className="w-full p-2 border rounded-md"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    >
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIAS_MOZAMBIQUE.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="definicao">Definição*</Label>
                  <Textarea
                    id="definicao"
                    required
                    value={formData.definicao}
                    onChange={(e) => setFormData({...formData, definicao: e.target.value})}
                    placeholder="Definição clara e precisa do termo jurídico"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="lei_referencia">Lei de Referência</Label>
                    <Input
                      id="lei_referencia"
                      value={formData.lei_referencia}
                      onChange={(e) => setFormData({...formData, lei_referencia: e.target.value})}
                      placeholder="Ex: Lei nº 19/97"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artigo_referencia">Artigo</Label>
                    <Input
                      id="artigo_referencia"
                      value={formData.artigo_referencia}
                      onChange={(e) => setFormData({...formData, artigo_referencia: e.target.value})}
                      placeholder="Ex: Artigo 35"
                    />
                  </div>
                  <div>
                    <Label htmlFor="decreto_referencia">Decreto</Label>
                    <Input
                      id="decreto_referencia"
                      value={formData.decreto_referencia}
                      onChange={(e) => setFormData({...formData, decreto_referencia: e.target.value})}
                      placeholder="Ex: Decreto nº 43/2003"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="exemplo">Exemplo de Uso</Label>
                  <Textarea
                    id="exemplo"
                    value={formData.exemplo}
                    onChange={(e) => setFormData({...formData, exemplo: e.target.value})}
                    placeholder="Exemplo prático de uso do termo"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sinonimos">Sinônimos</Label>
                    <Input
                      id="sinonimos"
                      value={formData.sinonimos}
                      onChange={(e) => setFormData({...formData, sinonimos: e.target.value})}
                      placeholder="Separar por vírgula"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nivel_tecnico">Nível Técnico</Label>
                    <select
                      id="nivel_tecnico"
                      className="w-full p-2 border rounded-md"
                      value={formData.nivel_tecnico}
                      onChange={(e) => setFormData({...formData, nivel_tecnico: e.target.value})}
                    >
                      {NIVEIS_TECNICOS.map(nivel => (
                        <option key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="Separar por vírgula (ex: terra, agricultura, DUAT)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingTermo ? 'Atualizar' : 'Adicionar'} Termo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTermo(null)
                      setFormData({
                        termo: '',
                        definicao: '',
                        categoria: '',
                        nivel_tecnico: 'basico',
                        exemplo: '',
                        sinonimos: '',
                        lei_referencia: '',
                        artigo_referencia: '',
                        decreto_referencia: '',
                        tags: ''
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}