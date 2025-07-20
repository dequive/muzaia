
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Cpu,
  Zap
} from 'lucide-react'

interface ModelStatus {
  id: string
  name: string
  type: 'local' | 'api'
  status: 'online' | 'offline' | 'error'
  latency?: number
  usage?: number
  last_check: string
}

const statusColors = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800'
}

const statusIcons = {
  online: CheckCircle,
  offline: XCircle,
  error: AlertTriangle
}

export function ModelStatus() {
  const [models, setModels] = useState<ModelStatus[]>([
    {
      id: '1',
      name: 'Claude 3.5 Sonnet',
      type: 'api',
      status: 'online',
      latency: 245,
      usage: 78,
      last_check: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'Local LLM',
      type: 'local',
      status: 'offline',
      latency: 0,
      usage: 0,
      last_check: new Date().toISOString()
    }
  ])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshStatus = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Cpu className="h-5 w-5" />
          <span>Model Status</span>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshStatus}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map((model) => {
          const StatusIcon = statusIcons[model.status]
          return (
            <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <StatusIcon className={`h-5 w-5 ${
                  model.status === 'online' ? 'text-green-500' :
                  model.status === 'error' ? 'text-red-500' : 'text-gray-500'
                }`} />
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>{model.type === 'api' ? 'API' : 'Local'}</span>
                    {model.latency && model.latency > 0 && (
                      <>
                        <span>•</span>
                        <span>{model.latency}ms</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {model.usage && model.usage > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Zap className="h-3 w-3" />
                    <span>{model.usage}%</span>
                  </div>
                )}
                <Badge className={statusColors[model.status]}>
                  {model.status}
                </Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
