'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  User, 
  Search, 
  AlertTriangle, 
  Clock,
  Shield,
  Download
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

// O Next.js está procurando por uma exportação nomeada "AuditLogs",
// não uma exportação padrão
export function AuditLogs() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const currentUser = 'dequive'
  const currentTimestamp = '2025-07-01 22:33:01'
  
  // Dados de exemplo - em produção, isso viria de uma API
  const logs = [
    { 
      id: '1', 
      user: 'dequive', 
      action: 'Login', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 22:30:30',
      severity: 'info',
      details: 'Login bem sucedido via OAuth'
    },
    { 
      id: '2', 
      user: 'Admin', 
      action: 'Configuração', 
      resource: 'Sistema', 
      timestamp: '2025-07-01 22:15:10',
      severity: 'info',
      details: 'Alteração de configurações de segurança'
    },
    { 
      id: '3', 
      user: 'João Pereira', 
      action: 'Acesso Negado', 
      resource: 'Admin Panel', 
      timestamp: '2025-07-01 21:48:05',
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
      user: 'dequive', 
      action: 'Atualização', 
      resource: 'Configurações', 
      timestamp: '2025-07-01 20:15:22',
      severity: 'info',
      details: 'Atualização de preferências do sistema'
    },
  ]
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500'
      case 'warning': return 'bg-orange-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredLogs = logs
    .filter(log => filter === 'all' || log.severity === filter)
    .filter(log => 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const userHighlights = (username: string) => {
    return username === currentUser 
      ? 'font-semibold text-primary' 
      : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs de Auditoria</CardTitle>
        <CardDescription className="text-xs">Última atualização: {currentTimestamp}</CardDescription>
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
            {filteredLogs.map((log) => (
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
                      <span className={userHighlights(log.user)}>{log.user}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <Shield className="inline mr-1 h-3 w-3" /> 
            Logs seguros • Conforme LGPD
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
