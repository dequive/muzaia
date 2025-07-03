'use client'

import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/error'
import type { AuditLog } from '@/types'

export interface AuditLogsProps {
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function AuditLogs({ 
  limit = 50,
  autoRefresh = false,
  refreshInterval = 30000 
}: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const { toast } = useToast()
  const abortController = useRef<AbortController>()
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Altura estimada de cada item
    overscan: 5 // Número de itens para pré-renderizar
  })

  const fetchLogs = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/audit-logs', { signal })
      
      if (!response.ok) {
        throw new ApiError(
          response.status,
          'Falha ao carregar logs',
          'FETCH_LOGS_ERROR'
        )
      }
      
      const data = await response.json()
      setLogs(data.slice(0, limit))
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      
      const error = ApiError.fromError(err)
      setError(error)
      toast({
        title: 'Erro ao carregar logs',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    abortController.current = new AbortController()
    fetchLogs(abortController.current.signal)
    
    let intervalId: NodeJS.Timeout
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchLogs(abortController.current?.signal)
      }, refreshInterval)
    }
    
    return () => {
      abortController.current?.abort()
      if (intervalId) clearInterval(intervalId)
    }
  }, [limit, autoRefresh, refreshInterval])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Logs de Auditoria</span>
          {isLoading && <span className="text-sm text-muted-foreground">Carregando...</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea 
          ref={parentRef} 
          className="h-[400px]" 
          viewportRef={virtualizer.scrollElement}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const log = logs[virtualItem.index]
              return (
                <div
                  key={log.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
