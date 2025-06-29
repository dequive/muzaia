// Root layout
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mozaia - Orquestrador LLM Inteligente',
  description: 'Plataforma avançada para orquestração de múltiplos modelos de linguagem com consenso inteligente',
  keywords: ['LLM', 'AI', 'Orquestrador', 'Consenso', 'Mozambique', 'Inteligência Artificial'],
  authors: [{ name: 'Mozaia Team' }],
  creator: 'Mozaia',
  publisher: 'Mozaia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mozaia.mz'),
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: 'https://mozaia.mz',
    title: 'Mozaia - Orquestrador LLM Inteligente',
    description: 'Plataforma avançada para orquestração de múltiplos modelos de linguagem',
    siteName: 'Mozaia',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mozaia - Orquestrador LLM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mozaia - Orquestrador LLM Inteligente',
    description: 'Plataforma avançada para orquestração de múltiplos modelos de linguagem',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-MZ" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          jetbrainsMono.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'white',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
