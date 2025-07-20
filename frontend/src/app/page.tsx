
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
            Começar Chat
          </a>
          <a
            href="/docs"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Documentação
          </a>
        </div>
      </div>
    </div>
  )
}
