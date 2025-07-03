import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import type { SystemOperation, SystemStatus } from '@/types/system'

interface SystemState {
  isMaintenanceMode: boolean
  isDebugMode: boolean
  operations: SystemOperation[]
  systemStatus: SystemStatus
}

export function useSystemControls(initialUser: string) {
  const [state, setState] = useState<SystemState>({
    isMaintenanceMode: false,
    isDebugMode: false,
    operations: [],
    systemStatus: {
      status: 'operational',
      lastUpdated: new Date().toISOString()
    }
  })

  const addOperation = useCallback((operation: Omit<SystemOperation, 'id' | 'timestamp' | 'user'>) => {
    setState(prev => ({
      ...prev,
      operations: [
        ...prev.operations,
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          user: initialUser,
          ...operation
        }
      ].slice(-50) // Manter apenas últimas 50 operações
    }))
  }, [initialUser])

  const toggleMaintenanceMode = useCallback(async (enabled: boolean) => {
    try {
      const response = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (!response.ok) throw new Error('Falha ao alterar modo de manutenção')

      setState(prev => ({ ...prev, isMaintenanceMode: enabled }))
      addOperation({
        message: `Modo de manutenção ${enabled ? 'ativado' : 'desativado'}`,
        status: 'success'
      })
      toast.success(`Modo de manutenção ${enabled ? 'ativado' : 'desativado'}`)
    } catch (error) {
      addOperation({
        message: `Erro ao alterar modo de manutenção: ${error.message}`,
        status: 'error'
      })
      toast.error('Falha ao alterar modo de manutenção')
    }
  }, [addOperation])

  const toggleDebugMode = useCallback(async (enabled: boolean) => {
    try {
      const response = await fetch('/api/system/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (!response.ok) throw new Error('Falha ao alterar modo debug')

      setState(prev => ({ ...prev, isDebugMode: enabled }))
      addOperation({
        message: `Modo debug ${enabled ? 'ativado' : 'desativado'}`,
        status: 'info'
      })
    } catch (error) {
      addOperation({
        message: `Erro ao alterar modo debug: ${error.message}`,
        status: 'error'
      })
      toast.error('Falha ao alterar modo debug')
    }
  }, [addOperation])

  return {
    state,
    addOperation,
    toggleMaintenanceMode,
    toggleDebugMode
  }
}
