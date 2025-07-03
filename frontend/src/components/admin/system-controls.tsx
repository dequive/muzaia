'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSystem } from '@/hooks/useSystem'

export interface SystemControlsProps {
  onSystemUpdate?: () => void
}

export function SystemControls({ onSystemUpdate }: SystemControlsProps) {
  const { restartSystem, clearCache, updateSystem } = useSystem()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controles do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={restartSystem}
          variant="outline"
          className="w-full"
        >
          Reiniciar Sistema
        </Button>
        <Button 
          onClick={clearCache}
          variant="outline"
          className="w-full"
        >
          Limpar Cache
        </Button>
        <Button 
          onClick={() => {
            updateSystem()
            onSystemUpdate?.()
          }}
          className="w-full"
        >
          Atualizar Sistema
        </Button>
      </CardContent>
    </Card>
  )
}
