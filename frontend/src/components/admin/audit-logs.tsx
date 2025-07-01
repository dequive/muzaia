'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  AlertTriangle, 
  Clock,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'react-hot-toast'

export function AuditLogs() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastRefresh, setLastRefresh] = useState('2025-07-01 22:20:22')
  const currentUser = 'dequive'
  
  // Dados de exemplo - em produção, isso viria de uma API
  const logs = [
    { 
      id: '1', 
      user: 'dequive', 
      action: 'Login', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 22:15:30',
      severity: 'info',
      details: 'Login bem sucedido via OAuth'
    },
    { 
      id: '2', 
      user: 'dequive', 
      action: 'Configuração', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 22:10:10',
      severity: 'info',
      details: 'Alteração de configurações de segurança'
    },
    { 
      id: '3', 
      user: 'joao.silva', 
      action: 'Acesso Negado', 
      resource: 'Admin Panel', 
      timestamp: '2025-07-01 21:45:05',
      severity: 'warning',
      details: 'Tentativa de acesso a recurso restrito'
    },
    { 
      id: '4', 
      user: 'Sistema', 
      action: 'Erro', 
      resource: 'API', 
      timestamp: '2025-07-01 21:32:47',
      severity: 'error',
      details: 'Falha na conexão com serviço externo'
    },
    { 
      id: '5', 
      user: 'maria.souza', 
      action: 'Atualização', 
      resource: 'Usuário', 
      timestamp: '2025-07-01 20:15:22',
      severity: 'info',
      details: 'Atualização de informações de perfil'
    },
    { 
      id: '6', 
      user: 'Sistema', 
      action: 'Backup', 
      resource: 'Banco de Dados', 
      timestamp: '2025-07-01 18:00:00',
      severity: 'info',
      details: 'Backup automático concluído com sucesso'
    },
    { 
      id: '7', 
      user: 'carlos.mendes', 
      action: 'Logout', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 17:22:15',
      severity: 'info',
      details: 'Sessão encerrada'
    },
    { 
      id: '8', 
      user: 'dequive', 
      action: 'Reinicialização', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 16:45:00',
      severity: 'warning',
      details: 'Reinicialização do sistema solicitada'
    },
  ]
  
  const handleRefreshLogs = () => {
    toast.success('Logs atualizados')
    setLastRefresh('2025-07-01 22:20:22')
  }

  const handleExportLogs = () => {
    toast.success('Exportação de logs iniciada')
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500'
      case 'warning': return 'bg-orange-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <FileText className="h-4 w-4 text-blue-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredLogs = logs
    .filter(log => filter === 'all' || log.severity === filter)
    .filter(log => 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const userHighlights = (username: string) => {
    return username === currentUser 
      ? 'font-semibold text-primary' 
      : '';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Logs de Auditoria</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleRefreshLogs} title="Atualizar logs">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs flex items-center justify-between">
          <span>Última atualização: {lastRefresh}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 py-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar logs..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Alertas</SelectItem>
              <SelectItem value="error">Erros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <ScrollArea className="h-[320px]">
          <div className="space-y-1 px-3">
            {filteredLogs.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-2 rounded-lg p-3 hover:bg-accent transition-colors cursor-default"
                >
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${getSeverityColor(log.severity)}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{log.action} - {log.resource}</div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {log.timestamp}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{log.details}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        <span className={userHighlights(log.user)}>
                          {log.user}
                          {log.user === currentUser && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                              você
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <Shield className="inline mr-1 h-3 w-3" /> 
            Logs seguros • Conforme LGPD
          </div>
          <Button variant="ghost" size="sm" onClick={handleExportLogs} className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
