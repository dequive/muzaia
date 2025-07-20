// Progress bar for navigation
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ProgressBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {isLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary transition-all duration-500 ease-in-out"
          style={{ width: '100%' }}
        />
      )}
    </>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao Mozaia AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Orquestrador de LLMs com consenso inteligente
        </p>
        <div className="space-x-4">
          <a
            href="/chat"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Chat
          </a>
          <a
            href="/admin"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Administração
          </a>
        </div>
      </div>
    </div>
  )
}
