// Chat settings sidebar component
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Brain,
  Zap,
  Target,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Save,
  Bell,
  Shield,
  Database,
  Activity,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChatStore, chatActions } from '@/store'
import { useUIStore } from '@/store'
import { useSystem } from '@/hooks/useSystem'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { ContextType } from '@/types'

const contextOptions = [
  { value: 'general', label: 'Geral', icon: Brain },
  { value: 'technical', label: 'Técnico', icon: Zap },
  { value: 'legal', label: 'Jurídico', icon: Shield },
  { value: 'business', label: 'Negócios', icon: Target },
  { value: 'academic', label: 'Acadêmico', icon: HelpCircle },
]

export function ChatSettings() {
  const { ui, updateUI } = useUIStore()
  const { chatSettings, updateChatSettings } = useChatStore()
  const { models, health } = useSystem()
  const [localSettings, setLocalSettings] = useState({
    ...chatSettings,
    generation_params: {
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      ...chatSettings.generation_params
    }
  })
  const [hasChanges, setHasChanges] = useState(false)

  const handleClose = () => {
    updateUI({ chat_settings_open: false })
  }

  const handleSave = () => {
    updateChatSettings(localSettings)
    setHasChanges(false)
    toast.success('Configurações salvas!')
  }

  const handleReset = () => {
    setLocalSettings(chatSettings)
    setHasChanges(false)
    toast.success('Configurações resetadas!')
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(localSettings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mozaia-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Configurações exportadas!')
  }

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setLocalSettings({ ...localSettings, ...imported })
        setHasChanges(true)
        toast.success('Configurações importadas!')
      } catch (error) {
        toast.error('Erro ao importar configurações')
      }
    }
    reader.readAsText(file)
  }

  const updateLocalSetting = (path: string, value: any) => {
    const keys = path.split('.')
    const newSettings = { ...localSettings }
    let current = newSettings as any

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Configurações</h2>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Não salvo
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
              <TabsTrigger value="general" className="text-xs">Geral</TabsTrigger>
              <TabsTrigger value="models" className="text-xs">Modelos</TabsTrigger>
              <TabsTrigger value="interface" className="text-xs">Interface</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">Avançado</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Contexto Padrão
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Contexto usado para novas conversas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localSettings.default_context}
                    onValueChange={(value: ContextType) => 
                      updateLocalSetting('default_context', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contextOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Parâmetros de Geração
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Controle como os modelos geram respostas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Temperatura: {localSettings.generation_params?.temperature || 0.7}</Label>
                    <Slider
                      value={[localSettings.generation_params?.temperature || 0.7]}
                      onValueChange={([value]) => 
                        updateLocalSetting('generation_params.temperature', value)
                      }
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controla a criatividade das respostas
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs">Máximo de Tokens</Label>
                    <Input
                      type="number"
                      value={localSettings.generation_params?.max_tokens || 2000}
                      onChange={(e) => 
                        updateLocalSetting('generation_params.max_tokens', parseInt(e.target.value))
                      }
                      min={100}
                      max={4000}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tamanho máximo das respostas
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs">Top P: {localSettings.generation_params?.top_p || 0.9}</Label>
                    <Slider
                      value={[localSettings.generation_params?.top_p || 0.9]}
                      onValueChange={([value]) => 
                        updateLocalSetting('generation_params.top_p', value)
                      }
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controla a diversidade das palavras
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Comportamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Salvamento automático</Label>
                    <Switch
                      checked={localSettings.auto_save || false}
                      onCheckedChange={(checked) => 
                        updateLocalSetting('auto_save', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Streaming habilitado</Label>
                    <Switch
                      checked={localSettings.enable_streaming || false}
                      onCheckedChange={(checked) => 
                        updateLocalSetting('enable_streaming', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Models Settings */}
            <TabsContent value="models" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Modelos Disponíveis
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Status dos modelos LLM no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {models?.map((model) => (
                      <div key={model.name} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            model.available ? "bg-green-500" : "bg-red-500"
                          )} />
                          <div>
                            <p className="text-sm font-medium">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                        </div>
                        <Badge variant={model.available ? "default" : "secondary"}>
                          {model.available ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {localSettings.model_preference && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preferências de Modelo</CardTitle>
                    <CardDescription className="text-xs">
                      Ordem de prioridade dos modelos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {localSettings.model_preference.map((modelName, index) => (
                        <div key={modelName} className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <span className="text-xs font-mono">{index + 1}.</span>
                          <span className="text-sm">{modelName}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Interface Settings */}
            <TabsContent value="interface" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Exibição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mostrar respostas dos modelos</Label>
                    <Switch
                      checked={localSettings.show_model_responses || false}
                      onCheckedChange={(checked) => 
                        updateLocalSetting('show_model_responses', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mostrar scores de confiança</Label>
                    <Switch
                      checked={localSettings.show_confidence_scores || false}
                      onCheckedChange={(checked) => 
                        updateLocalSetting('show_confidence_scores', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Tema e Aparência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Tema do sistema</Label>
                    <Select value={ui.theme} onValueChange={(value) => updateUI({ theme: value as any })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Sons habilitados</Label>
                    <Switch
                      checked={ui.sound_enabled}
                      onCheckedChange={(checked) => 
                        updateUI({ sound_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Notificações</Label>
                    <Switch
                      checked={ui.notifications_enabled}
                      onCheckedChange={(checked) => 
                        updateUI({ notifications_enabled: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Dados e Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportSettings}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar configurações
                  </Button>

                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('import-settings')?.click()}
                      className="w-full justify-start"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Salvar histórico localmente</Label>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Análise de uso</Label>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Melhoramento automático</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {health && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Status do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'} className="ml-1">
                          {health.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Versão:</span>
                        <span className="ml-1 font-mono">{health.version}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="ml-1">{Math.floor((health.uptime || 0) / 3600)}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modelos:</span>
                        <span className="ml-1">{health.models_available?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="flex-1"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges}
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Configurações são salvas automaticamente
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
