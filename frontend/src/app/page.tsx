import { siteConfig } from "@/config/site"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Bem-vindo ao {siteConfig.name}
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          {siteConfig.description}
        </p>
        <div className="space-x-4">
          <a
            href="/chat"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Iniciar Chat
          </a>
          <a
            href="/docs"
            className="inline-block bg-gray-100 text-gray-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Documentação
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Consenso Inteligente</h3>
            <p className="text-gray-600">
              Sistema avançado de consenso entre múltiplos LLMs para respostas mais precisas
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Multi-LLM</h3>
            <p className="text-gray-600">
              Suporte a múltiplos modelos de linguagem com orquestração automática
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Localizado</h3>
            <p className="text-gray-600">
              Otimizado para o contexto moçambicano com suporte local completo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}