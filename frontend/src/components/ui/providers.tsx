// Global providers
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query/devtools'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { ProgressBar } from '@/components/progress-bar'

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: any) => {
        // Não retry em erros 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
    },
    mutations: {
      retry: 1,
    },
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProgressBar />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
