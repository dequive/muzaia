'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, Bot, User, Scale, AlertTriangle, CheckCircle,
  Clock, BookOpen, MessageSquare, Sparkles, Search,
  ExternalLink, ThumbsUp, ThumbsDown, Users
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    title: string
    reference: string
    confidence: number
  }>
  confidence?: number
  requires_human?: boolean
  escalation_reason?: string
  processing_time?: number
}

interface LegalChatInterfaceProps {
  conversationId?: string
}

export default function LegalChatInterface({ conversationId }: LegalChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(conversationId || '')
  const [showSources, setShowSources] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const validateLegalQuestion = (question: string): { isValid: boolean; reason?: string } => {
    const query = question.toLowerCase().trim();

    // Lista expandida de tópicos não jurídicos (deve ser rejeitado)
    const nonLegalTopics = [
      // Culinária
      'receita', 'culinária', 'cozinha', 'comida', 'prato', 'cozinhar', 'tempero', 'ingredientes',
      'sobremesa', 'almoço', 'jantar', 'café', 'bebida', 'restaurante',
      
      // Entretenimento
      'música', 'filme', 'cinema', 'série', 'jogo', 'videojogo', 'netflix', 'youtube',
      'teatro', 'concerto', 'artista', 'ator', 'cantor',
      
      // Desportos
      'futebol', 'desporto', 'desportos', 'esporte', 'basquetebol', 'voleibol',
      'natação', 'corrida', 'ginásio', 'exercício', 'treino',
      
      // Medicina/Saúde
      'medicina', 'saúde', 'doença', 'sintomas', 'medicamento', 'remédio',
      'médico', 'hospital', 'dor', 'febre', 'gripe', 'covid', 'vacina',
      
      // Tecnologia
      'programação', 'código', 'software', 'computador', 'app', 'aplicação',
      'website', 'internet', 'facebook', 'whatsapp', 'email', 'senha',
      
      // Ciências
      'matemática', 'cálculo', 'física', 'química', 'biologia', 'geografia',
      'história', 'astronomia', 'geologia',
      
      // Clima
      'clima', 'tempo', 'meteorologia', 'previsão', 'chuva', 'sol', 'temperatura',
      
      // Viagem/Turismo
      'viagem', 'turismo', 'hotel', 'voo', 'avião', 'praia', 'férias', 'destino',
      
      // Moda/Beleza
      'moda', 'roupa', 'vestido', 'sapatos', 'beleza', 'cosmético', 'cabelo', 'perfume',
      
      // Automóveis (não jurídicos)
      'carro', 'automóvel', 'conduzir', 'combustível', 'mecânico', 'pneu', 'motor',
      
      // Relacionamentos pessoais
      'namoro', 'paquera', 'conquista', 'romance', 'amizade', 'festa', 'presente',
      
      // Hobbies
      'jardinagem', 'pintura', 'desenho', 'fotografia', 'artesanato', 'puzzle'
    ];

    // Rejeitar se contém qualquer tópico não jurídico
    if (nonLegalTopics.some(topic => query.includes(topic))) {
      return { 
        isValid: false, 
        reason: "🚫 Esta pergunta não é sobre questões jurídicas.\n\n" +
                "✅ Posso ajudar com:\n" +
                "• Direitos e deveres legais\n" +
                "• Leis e legislação\n" +
                "• Contratos e procedimentos\n" +
                "• Questões de direito civil, penal, trabalho\n\n" +
                "Exemplo: \"Quais são os meus direitos como trabalhador?\""
      };
    }

    // Deve conter OBRIGATORIAMENTE pelo menos uma palavra jurídica
    const requiredLegalKeywords = [
      'lei', 'leis', 'direito', 'direitos', 'dever', 'deveres', 'legal', 'ilegal',
      'jurídico', 'juridico', 'código', 'artigo', 'tribunal', 'juiz', 'advogado',
      'processo', 'contrato', 'crime', 'penal', 'civil', 'obrigação', 'responsabilidade',
      'multa', 'procedimento', 'legislação', 'constituição', 'norma'
    ];

    const hasLegalKeyword = requiredLegalKeywords.some(keyword => query.includes(keyword));

    // Padrões específicos de perguntas jurídicas
    const legalQuestionPatterns = [
      'posso ser processado', 'tenho direito', 'é crime', 'é legal', 'é ilegal',
      'segundo a lei', 'que diz a lei', 'posso processar', 'meus direitos',
      'procedimento legal', 'como proceder'
    ];

    const hasLegalPattern = legalQuestionPatterns.some(pattern => query.includes(pattern));

    if (!hasLegalKeyword && !hasLegalPattern) {
      return {
        isValid: false,
        reason: "🔍 Pergunta deve ser especificamente sobre questões jurídicas.\n\n" +
                "✅ Use palavras como: direito, lei, legal, contrato, crime, processo, etc.\n\n" +
                "📝 Exemplos válidos:\n" +
                "• \"É legal gravar conversas?\"\n" +
                "• \"Meus direitos no trabalho\"\n" +
                "• \"Como fazer um contrato?\""
      };
    }

    // Spam e comercial
    const spamIndicators = [
      'comprar', 'vender', 'desconto', 'promoção', 'grátis', 'click',
      'oferta', 'barato', 'ganhar dinheiro', 'investimento'
    ];
    
    if (spamIndicators.some(spam => query.includes(spam))) {
      return { 
        isValid: false, 
        reason: "🚫 Apenas perguntas jurídicas são permitidas." 
      };
    }

    return { isValid: true };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Validar se é pergunta jurídica
    const validation = validateLegalQuestion(inputText);
    if (!validation.isValid) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: validation.reason || "Pergunta não é sobre questões jurídicas.",
        timestamp: new Date(),
        requires_human: true,
        escalation_reason: 'non_legal_topic'
      };
      setMessages(prev => [...prev, errorMessage]);
      setInputText('');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat/perguntar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          pergunta: inputText.trim(),
          conversa_id: currentConversationId,
          jurisdicao_preferida: 'mozambique'
        })
      })

      if (!response.ok) {
        throw new Error('Erro na resposta da API')
      }

      const data = await response.json()

      // Atualizar conversation ID se for nova
      if (!currentConversationId) {
        setCurrentConversationId(data.conversa_id)
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.resposta,
        timestamp: new Date(data.timestamp),
        sources: data.fontes || [],
        confidence: data.confianca,
        requires_human: data.requer_humano,
        escalation_reason: data.motivo_escalacao,
        processing_time: data.tempo_processamento_ms
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Ocorreu um erro ao processar a sua pergunta. Por favor, tente novamente.',
        timestamp: new Date(),
        requires_human: true,
        escalation_reason: 'system_error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatConfidence = (confidence?: number) => {
    if (!confidence) return 'N/A'
    return `${(confidence * 100).toFixed(0)}%`
  }

  const getConfidenceBadgeColor = (confidence?: number) => {
    if (!confidence) return 'secondary'
    if (confidence >= 0.8) return 'default' // Verde
    if (confidence >= 0.6) return 'secondary' // Amarelo
    return 'destructive' // Vermelho
  }

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`flex gap-3 mb-6 ${message.type === 'user' ? 'justify-end' : ''}`}>
      {message.type === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}

      <div className={`flex-1 ${message.type === 'user' ? 'max-w-md ml-auto' : 'max-w-4xl'}`}>
        <div className={`p-4 rounded-lg ${
          message.type === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-50 border'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Informações técnicas para respostas da IA */}
          {message.type === 'assistant' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{message.processing_time}ms</span>

                {message.confidence !== undefined && (
                  <>
                    <Badge variant={getConfidenceBadgeColor(message.confidence)} className="text-xs">
                      Confiança: {formatConfidence(message.confidence)}
                    </Badge>
                  </>
                )}

                {message.requires_human && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Requer Humano
                  </Badge>
                )}
              </div>

              {/* Fontes legais */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                    className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Ver fontes legais ({message.sources.length})
                  </Button>

                  {showSources === message.id && (
                    <div className="mt-2 space-y-2">
                      {message.sources.map((source, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium text-gray-800">{source.title}</div>
                          <div className="text-gray-600">{source.reference}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {formatConfidence(source.confidence)} confiança
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Motivo de escalação */}
              {message.escalation_reason && (
                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Motivo: {message.escalation_reason}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          {message.type === 'user' ? (
            <User className="w-3 h-3" />
          ) : (
            <Bot className="w-3 h-3" />
          )}
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )

  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    type: 'assistant',
    content: `⚖️ **Assistente Jurídico Exclusivo - Moçambique**

🎯 **ATENÇÃO: Respondo APENAS a questões jurídicas**

**✅ Posso ajudar com:**
• 📋 **Direitos e deveres** dos cidadãos
• 📜 **Leis e códigos** moçambicanos
• ⚖️ **Procedimentos legais** (tribunais, processos)
• 📝 **Contratos** e obrigações legais
• 👨‍👩‍👧‍👦 **Direito de família** (casamento, divórcio, herança)
• 💼 **Direito do trabalho** (contratos, despedimentos)
• 🏛️ **Direito penal** (crimes, penalizações)
• 🏢 **Direito comercial** e administrativo

**🚫 NÃO respondo sobre:**
Medicina, culinária, desportos, tecnologia, relacionamentos, música, cinema, moda, viagens, etc.

**💡 Exemplos de perguntas VÁLIDAS:**
• "É crime não pagar pensão alimentar?"
• "Posso ser despedido sem justa causa?"
• "Quais os meus direitos como consumidor?"
• "Como fazer um testamento em Moçambique?"

**Faça a sua pergunta JURÍDICA:**`,
    timestamp: new Date(),
  };

  useEffect(() => {
    setMessages([welcomeMessage]);
  }, []);

  return (
    <div className="flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Assistente Jurídico IA</h2>
            <p className="text-sm text-gray-600">
              Baseado no repositório legal de Moçambique
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Busca Semântica
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Scale className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bem-vindo ao Assistente Jurídico
            </h3>
            <p className="text-gray-600 max-w-md">
              Faça perguntas sobre a legislação moçambicana. O sistema busca automaticamente 
              nas leis validadas e responde em linguagem simples.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Exemplos de perguntas:</p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• "Posso ser despedido sem justa causa?"</li>
                <li>• "Quais são os meus direitos como trabalhador?"</li>
                <li>• "Como funciona o divórcio em Moçambique?"</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Faça a sua pergunta legal..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span>💡 Pressione Enter para enviar, Shift+Enter para nova linha</span>
          {currentConversationId && (
            <span className="text-blue-600">ID: {currentConversationId.slice(0, 8)}...</span>
          )}
        </div>
      </div>
    </div>
  )
}