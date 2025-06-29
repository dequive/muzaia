// Lazy loading components for better performance
import dynamic from 'next/dynamic'
import { LoadingScreen } from '@/components/loading-screen'

// Lazy load heavy components
export const MetricsCharts = dynamic(
  () => import('@/components/system/metrics-charts').then(mod => ({ default: mod.MetricsCharts })),
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  }
)

export const ChatSettings = dynamic(
  () => import('@/components/chat/chat-settings').then(mod => ({ default: mod.ChatSettings })),
  {
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
  }
)

export const AdminDashboard = dynamic(
  () => import('@/components/admin/admin-overview').then(mod => ({ default: mod.AdminOverview })),
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  }
)

export const SystemMonitor = dynamic(
  () => import('@/components/system/system-overview').then(mod => ({ default: mod.SystemOverview })),
  {
    loading: () => <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded-lg" />
      ))}
    </div>,
  }
)
