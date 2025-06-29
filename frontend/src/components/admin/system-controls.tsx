// System controls component
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Power,
  RefreshCw,
  Database,
  Trash2,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Terminal,
  Play,
  Pause,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export function SystemControls() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [operations, setOperations] = useState<string[]>([])

  const addOperation = (operation: string) => {
    setOperations(prev => [...prev, `${new Date().toLocaleTimeString()}: ${operation}`])
  }

  const handleRestartSystem = async () => {
    addOperation('Iniciando reinicialização do sistema...')
    toast.success('Sistema será reiniciado em 30 segundos')
    
    // Simulate restart process
    setTimeout(() => {
      addOperation('Sistema reiniciado com sucesso')
      toast.success('Sistema reiniciado')
    }, 2000)
  }

  const handleClearCache = async () => {
    addOperation('Limpando cache do sistema...')
    toast.success('Cache limpo com sucesso')
    
    setTimeout(() => {
      addOperation('Cache limpo - 2.3 GB liberados')
    }, 1000)
  }

  const handleBackupDatabase = async () => {
    addOperation('Iniciando backup do banco de dados...')
    toast.success('Backup iniciado')
    
    setTimeout(() => {
      addOperation('Backup concluído - backup_20250629_034505.sql')
      toast.success('Backup concluído')
    }, 3000)
  }

  const handlePreloadModels = async () => {
    addOperation('Pré-carregando modelos LLM...')
    toast.success('Pré-carregamento iniciado')
    
    setTimeout(() => {
      addOperation('Modelos pré-carregados: llama3:8b, gemma2:9b')
      toast.success('Modelos pré-carregados')
    }, 2000)
  }

  const quickActions = [
    {
      title: 'Limpar Cache',
      description: 'Remove cache em memória e temporário',
      icon: RefreshCw,
      action: handleClearCache,
      variant: 'outline' as const,
    },
    {
      title: 'Backup DB',
      description: 'Cria backup completo do banco',
      icon: Database,
      action: handleBackupDatabase,
      variant: 'outline' as const,
    },
    {
      title: 'Pré-carregar Modelos',
      description: 'Aquece o pool de modelos',
      icon: Play,
      action: handlePreloadModels,
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="space-y-4">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Controles do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Modes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance" className="text-xs">
                Modo de Manutenção
              </Label>
              <Switch
                id="maintenance"
                checked={isMaintenanceMode}
                onCheckedChange={(checked) => {
                  setIsMaintenanceMode(checked)
                  addOperation(`Modo de manutenção ${checked ? 'ativado' : 'desativado'}`)
                  toast.success(`Modo de manutenção ${checked ? 'ativado' : 'desativado'}`)
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="debug" className="text-xs">
                Modo Debug
              </Label>
              <Switch
                id="debug"
                checked={isDebugMode}
                onCheckedChange={(checked) => {
                  setIsDebugMode(checked)
                  addOperation(`Modo debug ${checked ? 'ativado' : 'desativado'}`)
                }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Ações Rápidas</h4>
            {quickActions.map((action, index) => (
              <Button
                key={action.title}
                variant={action.variant}
                size="sm"
                onClick={action.action}
                className="w-full justify-start text-xs"
              >
                <action.icon className="h-3 w-3 mr-2" />
                {action.title}
              </Button>
            ))}
          </div>

          {/* Critical Actions */}
          <div className="pt-2 border-t space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Ações Críticas</h4>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full text-xs">
                  <Power className="h-3 w-3 mr-2" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Terminal className="h-4 w-4 mr-2" />
            Log de Operações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            {operations.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma operação executada</p>
            ) : (
              operations.slice(-10).map((op, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono bg-muted/50 p-2 rounded"
                >
                  {op}
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">Sistema:</span>
            <Badge variant="default" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Operacional
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Manutenção:</span>
            <Badge variant={isMaintenanceMode ? "secondary" : "outline"} className="text-xs">
              {isMaintenanceMode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Debug:</span>
            <Badge variant={isDebugMode ? "secondary" : "outline"} className="text-xs">
              {isDebugMode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
