import Link from 'next/link'

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
          <Link
            href="/chat"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Chat
          </Link>
          <Link
            href="/admin"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Administração
          </Link>
        </div>
      </div>
    </div>
  )
}