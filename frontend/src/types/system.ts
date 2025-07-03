import type { LucideIcon } from 'lucide-react'

export interface SystemOperation {
  id: string
  timestamp: string
  message: string
  status: 'success' | 'error' | 'info' | 'warning'
  user: string
}

export interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  action: () => Promise<void>
  variant: 'default' | 'outline' | 'destructive'
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'maintenance' | 'offline'
  message?: string
  lastUpdated: string
}
