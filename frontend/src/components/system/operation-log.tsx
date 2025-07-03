import { memo } from 'react'
import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SystemOperation } from '@/types/system'

interface OperationLogProps {
  operations: SystemOperation[]
}

export const OperationLog = memo(function OperationLog({ operations }: OperationLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <Terminal className="h-4 w-4 mr-2" aria-hidden="true" />
          Log de Operações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar"
          role="log"
          aria-label="Log de operações do sistema"
        >
          {operations.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma operação executada</p>
          ) : (
            operations.map((op) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-xs font-mono p-2 rounded flex items-start justify-between",
                  op.status === 'error' && 'bg-destructive/10 text-destructive',
                  op.status === 'success' && 'bg-success/10 text-success',
                  op.status === 'warning' && 'bg-warning/10 text-warning',
                  op.status === 'info' && 'bg-muted/50'
                )}
              >
                <span>{op.message}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(op.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
})
