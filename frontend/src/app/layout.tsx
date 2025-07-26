
import { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
// Analytics e Speed Insights opcionais
let Analytics: any = () => null
let SpeedInsights: any = () => null

try {
  const vercelAnalytics = require('@vercel/analytics/react')
  const vercelInsights = require('@vercel/speed-insights/next')
  Analytics = vercelAnalytics.Analytics
  SpeedInsights = vercelInsights.SpeedInsights
} catch (error) {
  // Vercel packages not available - using placeholder components
}
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import '../styles/globals.css'

// =============================================================================
// FONTS
// =============================================================================

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  fallback: ['monospace']
})

// =============================================================================
// VIEWPORT & METADATA
// =============================================================================

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2, // Permitir zoom até 2x para acessibilidade
  minimumScale: 1,
  userScalable: true, // Importante para acessibilidade
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'LLM',
    'AI',
    'Orquestrador',
    'Consenso',
    'Moçambique',
    'Inteligência Artificial',
    'Machine Learning',
    'NLP',
    'Chatbot',
    'IA Generativa'
  ],
  authors: [
    {
      name: siteConfig.creator,
      url: siteConfig.links.github,
    },
  ],
  creator: siteConfig.creator,
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@mozaiaai',
    site: '@mozaiaai',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { 
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#00884c'
      }
    ]
  },
  manifest: '/manifest.json',
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'pt-MZ': '/pt-mz',
      'en-US': '/en',
    },
  },
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  category: 'technology',
}

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="pt"
      suppressHydrationWarning
      className={cn(
        inter.variable,
        jetbrainsMono.variable
      )}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#00884c" />
        {/* Preconectar com domínios externos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          'flex flex-col',
          // Esconder scrollbar mas manter funcionalidade
          'scrollbar-gutter-stable',
          // Melhor renderização de fontes
          'text-rendering-optimizeLegibility',
          // Melhor suavização de fontes
          'font-smooth-antialiased',
          // Prevenir FOUC
          'transition-colors duration-150',
          // Melhor comportamento de toque em mobile
          'touch-manipulation'
        )}
        suppressHydrationWarning
      >
        <Providers>
          {/* Skip Link para acessibilidade */}
          <a 
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50"
          >
            Pular para o conteúdo principal
          </a>
          
          <div className="relative flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>

          <Toaster 
            position="top-right" 
            expand 
            closeButton 
            richColors 
            duration={4000}
            theme="system"
          />
        </Providers>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />

        {/* Indicador de Tailwind em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && <TailwindIndicator />}
      </body>
    </html>
  )
}
