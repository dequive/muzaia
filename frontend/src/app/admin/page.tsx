
// This file has been removed to resolve route conflict with /(dashboard)/admin/page.tsx
// The admin functionality is now handled by the dashboard route group
export default function AdminRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin'
  }
  return null
}

interface ProfessionalUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  specializations: string[]
  jurisdiction: string
  license_number?: string
  created_at: string
  approved_at?: string
  last_active_at?: string
  total_conversations: string
  user_rating: string
}

interface AdminStats {
  pending_approvals: number
  approved_professionals: number
  blocked_professionals: number
  total_professionals: number
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800'
}

const roleLabels = {
  legal_tech: 'Técnico Jurídico',
  lawyer: 'Advogado',
  staff: 'Staff',
  admin: 'Administrador'
}

export default function AdminPage() {
  const [professionals, setProfessionals] = useState<ProfessionalUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('admin_token')
    if (!token) {
      window.location.href = '/admin/login'
      return
    }
    setIsAuthenticated(true)
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalUser | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Formulário de criação
  const [newProfessional, setNewProfessional] = useState({
    email: '',
    full_name: '',
    role: 'legal_tech',
    specializations: '',
    jurisdiction: '',
    license_number: '',
    phone: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [statusFilter, roleFilter])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Carregar profissionais
      const professionalsResponse = await fetch('/api/admin/professionals?' + new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      }))
      
      if (professionalsResponse.ok) {
        const professionalsData = await professionalsResponse.json()
        setProfessionals(professionalsData.professionals || [])
      }

      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (professionalId: string) => {
    try {
      const formData = new FormData()
      formData.append('reason', 'Aprovado após verificação de documentos')
      formData.append('notes', 'Documentação em ordem')

      const response = await fetch(`/api/admin/professionals/${professionalId}/approve`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        loadData()
        alert('Profissional aprovado com sucesso!')
      } else {
        alert('Erro ao aprovar profissional')
      }
    } catch (error) {
      console.error('Error approving professional:', error)
      alert('Erro ao aprovar profissional')
    }
  }

  const handleReject = async (professionalId: string, reason: string) => {
    try {
      const formData = new FormData()
      formData.append('reason', reason)

      const response = await fetch(`/api/admin/professionals/${professionalId}/reject`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        loadData()
        alert('Profissional rejeitado')
      } else {
        alert('Erro ao rejeitar profissional')
      }
    } catch (error) {
      console.error('Error rejecting professional:', error)
      alert('Erro ao rejeitar profissional')
    }
  }

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const formData = new FormData()
      Object.entries(newProfessional).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const response = await fetch('/api/admin/professionals', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        loadData()
        setNewProfessional({
          email: '',
          full_name: '',
          role: 'legal_tech',
          specializations: '',
          jurisdiction: '',
          license_number: '',
          phone: '',
          notes: ''
        })
        alert(`Profissional criado! Senha temporária: ${result.temp_password}`)
      } else {
        alert('Erro ao criar profissional')
      }
    } catch (error) {
      console.error('Error creating professional:', error)
      alert('Erro ao criar profissional')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredProfessionals = professionals.filter(prof => 
    prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">A verificar autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gestão de técnicos jurídicos e advogados</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>Administrador</span>
        </Badge>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending_approvals}</p>
                  <p className="text-sm text-gray-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved_professionals}</p>
                  <p className="text-sm text-gray-600">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.blocked_professionals}</p>
                  <p className="text-sm text-gray-600">Bloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_professionals}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="professionals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
          <TabsTrigger value="create">Criar Novo</TabsTrigger>
        </TabsList>

        <TabsContent value="professionals" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Pesquisar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="legal_tech">Técnico</SelectItem>
                    <SelectItem value="lawyer">Advogado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Utilizadores Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">A carregar...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jurisdição</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessionals.map((professional) => (
                      <TableRow key={professional.id}>
                        <TableCell className="font-medium">
                          {professional.full_name}
                        </TableCell>
                        <TableCell>{professional.email}</TableCell>
                        <TableCell>
                          {roleLabels[professional.role as keyof typeof roleLabels]}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[professional.status as keyof typeof statusColors]}>
                            {professional.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{professional.jurisdiction}</TableCell>
                        <TableCell>
                          {new Date(professional.created_at).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {professional.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleApprove(professional.id)}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Rejeitar Profissional</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja rejeitar este profissional?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleReject(professional.id, 'Documentação insuficiente')}
                                      >
                                        Rejeitar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Criar Novo Profissional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProfessional} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={newProfessional.full_name}
                      onChange={(e) => setNewProfessional({...newProfessional, full_name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newProfessional.email}
                      onChange={(e) => setNewProfessional({...newProfessional, email: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select 
                      value={newProfessional.role} 
                      onValueChange={(value) => setNewProfessional({...newProfessional, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="legal_tech">Técnico Jurídico</SelectItem>
                        <SelectItem value="lawyer">Advogado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="jurisdiction">Jurisdição</Label>
                    <Input
                      id="jurisdiction"
                      value={newProfessional.jurisdiction}
                      onChange={(e) => setNewProfessional({...newProfessional, jurisdiction: e.target.value})}
                      placeholder="Portugal, Brasil, etc."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_number">Número OAB/Ordem</Label>
                    <Input
                      id="license_number"
                      value={newProfessional.license_number}
                      onChange={(e) => setNewProfessional({...newProfessional, license_number: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newProfessional.phone}
                      onChange={(e) => setNewProfessional({...newProfessional, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specializations">Especializações (separadas por vírgula)</Label>
                  <Input
                    id="specializations"
                    value={newProfessional.specializations}
                    onChange={(e) => setNewProfessional({...newProfessional, specializations: e.target.value})}
                    placeholder="criminal, civil, laboral, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas Administrativas</Label>
                  <Input
                    id="notes"
                    value={newProfessional.notes}
                    onChange={(e) => setNewProfessional({...newProfessional, notes: e.target.value})}
                  />
                </div>

                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? 'A criar...' : 'Criar Profissional'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
