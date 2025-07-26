
import { Metadata } from 'next'
import { AdvancedMetrics } from '@/components/admin/advanced-metrics'

export const metadata: Metadata = {
  title: 'Métricas Administrativas - Mozaia',
  description: 'Métricas completas do sistema para administradores',
}

export default function AdminMetricsPage() {
  return (
    <div className="container mx-auto py-6">
      <AdvancedMetrics />
    </div>
  )
}
