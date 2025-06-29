// Authentication provider
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoadingScreen } from '@/components/loading-screen'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializing } = useAuth()

  if (initializing) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
