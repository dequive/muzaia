'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
