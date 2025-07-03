'use client'

import { useCallback } from 'react'
import {
  Power,
  RefreshCw,
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'react-hot-toast'
import { useSystemControls } from '@/hooks/useSystemControls'
import { OperationLog } from './operation-log'
import type { QuickAction } from '@/types/system'

interface SystemControlsProps {
  username: string
}

export function SystemControls({ username }: SystemControlsProps) {
  const { state, addOperation, toggleMaintenanceMode, toggleDebugMode } = useSystemControls(username)
  
  const handleRestartSystem = useCallback(async () => {
    try {
      addOperation({
        message: 'Iniciando reinicialização do sistema...',
        status: 'warning'
      })
      
      const response = await fetch('/api/system/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Falha ao reiniciar sistema')
      
      addOperation({
        message: 'Sistema reiniciado com sucesso',
        status: 'success'
      })
      toast.success('Sistema reiniciado')
    } catch (error) {
      addOperation({
        message: `Erro ao reiniciar sistema: ${error.message}`,
        status: 'error'
      })
      toast.error('Falha ao reiniciar sistema')
    }
  }, [addOperation])

  const handleClearCache = useCallback(async () => {
    try {
      addOperation({
        message: 'Limpando cache do sistema...',
        status: 'info'
      })
      
      const response = await fetch('/api/system/cache', { 
        method: 'DELETE' 
      })
      
      if (!response.ok) throw new Error('Falha ao limpar cache')
      
      const data = await response.json()
      addOperation({
        message: `Cache limpo com sucesso - ${data.freedSpace} liberados`,
        status: 'success'
      })
      toast.success('Cache limpo com sucesso')
    } catch (error) {
      addOperation({
        message: `Erro ao limpar cache: ${error.message}`,
        status: 'error'
      })
      toast.error('Falha ao limpar cache')
    }
  }, [addOperation])

  const handleBackupDatabase = useCallback(async () => {
    try {
      addOperation({
        message: 'Iniciando backup do banco de dados...',
        status: 'info'
      })
      
      const response = await fetch('/api/system/backup', {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Falha ao criar backup')
      
      const data = await response.json()
      addOperation({
        message: `Backup concluído - ${data.filename}`,
        status: 'success'
      })
      toast.success('Backup concluído')
    } catch (error) {
      addOperation({
        message: `Erro ao criar backup: ${error.message}`,
        status: 'error'
      })
      toast.error('Falha ao criar backup')
    }
  }, [addOperation])

  const quickActions: QuickAction[] = [
    {
      title: 'Limpar Cache',
      description: 'Remove cache em memória e temporário',
      icon: RefreshCw,
      action: handleClearCache,
      variant: 'outline',
    },
    {
      title: 'Backup DB',
      description: 'Cria backup completo do banco',
      icon: Database,
      action: handleBackupDatabase,
      variant: 'outline',
    },
    {
      title: 'Pré-carregar Modelos',
      description: 'Aquece o pool de modelos',
      icon: Play,
      action: async () => {
        try {
          addOperation({
            message: 'Pré-carregando modelos LLM...',
            status: 'info'
          })
          
          const response = await fetch('/api/system/models/preload', {
            method: 'POST'
          })
          
          if (!response.ok) throw new Error('Falha ao pré-carregar modelos')
          
          const data = await response.json()
          addOperation({
            message: `Modelos pré-carregados: ${data.models.join(', ')}`,
            status: 'success'
          })
          toast.success('Modelos pré-carregados')
        } catch (error) {
          addOperation({
            message: `Erro ao pré-carregar modelos: ${error.message}`,
            status: 'error'
          })
          toast.error('Falha ao pré-carregar modelos')
        }
      },
      variant: 'outline',
    },
  ]

  return (
    <div className="space-y-4">
      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            Controles do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Modes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="maintenance" 
                className="text-xs"
              >
                Modo de Manutenção
              </Label>
              <Switch
                id="maintenance"
                checked={state.isMaintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
                aria-label="Alternar modo de manutenção"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="debug" 
                className="text-xs"
              >
                Modo Debug
              </Label>
              <Switch
                id="debug"
                checked={state.isDebugMode}
                onCheckedChange={toggleDebugMode}
                aria-label="Alternar modo debug"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Ações Rápidas
            </h4>
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant={action.variant}
                size="sm"
                onClick={action.action}
                className="w-full justify-start text-xs"
                aria-label={`Executar ação: ${action.title}`}
              >
                <action.icon className="h-3 w-3 mr-2" aria-hidden="true" />
                {action.title}
              </Button>
            ))}
          </div>

          {/* Critical Actions */}
          <div className="pt-2 border-t space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Ações Críticas
            </h4>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full text-xs"
                  aria-label="Reiniciar sistema"
                >
                  <Power className="h-3 w-3 mr-2" aria-hidden="true" />
                  Reiniciar Sistema
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reiniciar Sistema?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá reiniciar todo o sistema Mozaia. Todos os usuários
                    serão desconectados temporariamente. Tem certeza?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestartSystem}>
                    Sim, reiniciar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Operations Log */}
      <OperationLog operations={state.operations} />

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">Sistema:</span>
            <Badge 
              variant={state.systemStatus.status === 'operational' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {state.systemStatus.status === 'operational' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  Operacional
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
                  {state.systemStatus.status}
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Manutenção:</span>
            <Badge 
              variant={state.isMaintenanceMode ? "secondary" : "outline"} 
              className="text-xs"
            >
              {state.isMaintenanceMode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Debug:</span>
            <Badge 
              variant={state.isDebugMode ? "secondary" : "outline"} 
              className="text-xs"
            >
              {state.isDebugMode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
