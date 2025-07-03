'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'

export interface AuditLogsProps {
  limit?: number
}

export function AuditLogs({ limit = 50 }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  
  useEffect(() => {
    // Fetch audit logs
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => setLogs(data.slice(0, limit)))
      .catch(console.error)
  }, [limit])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {logs.map((log) => (
            <div 
              key={log.id}
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
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
