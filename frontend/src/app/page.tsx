
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Cpu,
  TrendingUp,
  Sparkles,
  Scale,
  BookOpen,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Sparkles,
    title: 'IA Jurídica Especializada',
    description: 'Algoritmos treinados especificamente para o direito moçambicano com precisão excepcional.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: Scale,
    title: 'Consenso Inteligente',
    description: 'Sistema que combina múltiplos modelos LLM para respostas mais precisas e confiáveis.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    icon: Users,
    title: 'Chat Híbrido',
    description: 'Transição suave entre IA e advogados quando necessário para casos complexos.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: BookOpen,
    title: 'Repositório Legal',
    description: 'Acesso instantâneo a leis, jurisprudência e documentos oficiais atualizados.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    icon: Shield,
    title: 'Segurança Máxima',
    description: 'Proteção total dos dados com criptografia de ponta e conformidade legal.',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  {
    icon: Clock,
    title: 'Disponível 24/7',
    description: 'Assistência jurídica disponível a qualquer momento, sem horários limitados.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
  },
]

const stats = [
  { label: 'Precisão Legal', value: '98%', icon: TrendingUp },
  { label: 'Tempo de Resposta', value: '<3s', icon: Zap },
  { label: 'Disponibilidade', value: '99.9%', icon: Shield },
  { label: 'Casos Processados', value: '10K+', icon: BarChart3 },
]

const testimonials = [
  {
    name: 'Dr. Carlos Macamo',
    role: 'Advogado Sênior, Macamo & Associados',
    content: 'O Mozaia transformou nossa prática jurídica. A qualidade das análises legais é impressionante e economizamos horas de pesquisa.',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    name: 'Dra. Amélia Santos',
    role: 'Procuradora da República',
    content: 'Uma ferramenta indispensável para profissionais do direito. A precisão nas citações legais é excepcional.',
    rating: 5,
    avatar: '👩‍⚖️',
  },
  {
    name: 'João Tembe',
    role: 'Estudante de Direito, UEM',
    content: 'Como estudante, o Mozaia me ajuda a entender conceitos complexos e encontrar precedentes relevantes rapidamente.',
    rating: 5,
    avatar: '🎓',
  },
]

export default function HomePage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Mozaia
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">IA Jurídica</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/chat" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Chat
              </Link>
              <Link href="/chat-legal" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Legal
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              IA Jurídica Avançada para Moçambique
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-emerald-900 dark:from-white dark:via-blue-100 dark:to-emerald-100 bg-clip-text text-transparent leading-tight">
              Assistente Jurídico
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Inteligente
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Revolucione sua prática jurídica com IA especializada no direito moçambicano. 
              Respostas precisas, análises profundas e suporte 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/chat">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Começar Consulta
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/chat-legal">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Scale className="h-5 w-5 mr-2" />
                  Chat Legal Especializado
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                    <CardContent className="pt-6 text-center">
                      <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Recursos Avançados
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Tecnologia de ponta desenvolvida especificamente para o contexto jurídico moçambicano
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Confiado por Profissionais
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Veja o que nossos usuários dizem sobre o Mozaia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="h-full border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-6 italic leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{testimonial.avatar}</div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Pronto para Revolucionar
              <br />
              sua Prática Jurídica?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Junte-se a centenas de profissionais que já transformaram sua eficiência com o Mozaia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Começar Agora - Grátis
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 dark:bg-slate-950">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mozaia</h3>
                  <p className="text-sm text-slate-400">IA Jurídica para Moçambique</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Desenvolvido em Moçambique, para Moçambique. 
                Tecnologia jurídica que entende o nosso contexto legal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/chat" className="hover:text-white transition-colors">Chat IA</Link></li>
                <li><Link href="/chat-legal" className="hover:text-white transition-colors">Chat Legal</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><a href="mailto:suporte@mozaia.mz" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Mozaia. Feito com ❤️ em Moçambique.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
