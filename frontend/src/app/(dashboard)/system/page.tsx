// System monitoring dashboard
import { Metadata } from 'next'
import { SystemOverview } from '@/components/system/system-overview'
import { ModelStatus } from '@/components/system/model-status'
import { MetricsCharts } from '@/components/system/metrics-charts'
import { SystemLogs } from '@/components/system/system-overview'

export const metadata: Metadata = {
  title: 'Sistema - Mozaia',
  description: 'Monitoramento e métricas do sistema',
}

export default function SystemPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sistema</h1>
        <p className="text-muted-foreground">
          Monitoramento em tempo real do status e performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SystemOverview />
          <MetricsCharts />
        </div>
        <div className="space-y-6">
          <ModelStatus />
          <SystemLogs />
        </div>
      </div>
    </div>
  )
}
