// Landing page component
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  MessageSquare,
  Cpu,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const features = [
  {
    icon: Brain,
    title: 'Consenso Inteligente',
    description: 'Combina múltiplos modelos LLM para respostas mais precisas e confiáveis através de algoritmos de consenso avançados.',
  },
  {
    icon: Zap,
    title: 'Performance Otimizada',
    description: 'Pool de conexões, cache inteligente e streaming em tempo real para máxima velocidade de resposta.',
  },
  {
    icon: Shield,
    title: 'Segurança Enterprise',
    description: 'Autenticação robusta, rate limiting e monitoramento completo para ambientes corporativos.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Métricas detalhadas de performance, custos e qualidade para otimização contínua.',
  },
  {
    icon: Users,
    title: 'Multi-tenancy',
    description: 'Suporte nativo a múltiplos usuários e organizações com isolamento completo de dados.',
  },
  {
    icon: Globe,
    title: 'Localmente Adaptado',
    description: 'Desenvolvido em Moçambique, otimizado para o contexto e necessidades locais.',
  },
]

const stats = [
  { label: 'Modelos Suportados', value: '10+' },
  { label: 'Tempo de Resposta', value: '<2s' },
  { label: 'Disponibilidade', value: '99.9%' },
  { label: 'Precisão', value: '95%' },
]

const testimonials = [
  {
    name: 'Ana Silva',
    role: 'CTO, TechMoz',
    content: 'O Mozaia revolucionou nossa capacidade de processar consultas complexas. A qualidade das respostas é impressionante.',
    rating: 5,
  },
  {
    name: 'Carlos Mendoza',
    role: 'Diretor de IA, StartupMZ',
    content: 'A facilidade de integração e a robustez da plataforma superaram nossas expectativas. Recomendo fortemente.',
    rating: 5,
  },
  {
    name: 'Maria Santos',
    role: 'Lead Developer, DevCorp',
    content: 'Finalmente uma solução LLM que entende nossas necessidades locais. O suporte é excepcional.',
    rating: 5,
  },
]

export function LandingPage() {
  const [email, setEmail] = useState('')
  const { signUp, loading } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      await signUp(email, 'temp_password', { email })
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold text-gradient">Mozaia</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#features"
          >
            Recursos
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#pricing"
          >
            Preços
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#about"
          >
            Sobre
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="/login"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center space-y-8 text-center"
          >
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Orquestração Inteligente de{' '}
                <span className="text-gradient">Múltiplos LLMs</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Combine o poder de diferentes modelos de linguagem para obter respostas mais 
                precisas, confiáveis e contextualmente relevantes através de consenso inteligente.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <form onSubmit={handleSignUp} className="flex gap-2 flex-1">
                <Input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" loading={loading}>
                  Começar
                </Button>
              </form>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Gratuito para começar
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Sem cartão de crédito
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Recursos Avançados
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground mt-4 md:text-xl">
              Tudo que você precisa para implementar IA conversacional de nível enterprise
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Como Funciona
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground mt-4 md:text-xl">
              Processo simples em 3 etapas para respostas inteligentes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Envie sua Pergunta</h3>
              <p className="text-muted-foreground">
                Digite sua consulta na interface intuitiva do Mozaia
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Processamento Inteligente</h3>
              <p className="text-muted-foreground">
                Múltiplos LLMs processam sua pergunta simultaneamente
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Consenso e Resposta</h3>
              <p className="text-muted-foreground">
                O algoritmo de consenso gera a melhor resposta possível
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              O que dizem nossos clientes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-xl">
              Junte-se a centenas de empresas que já usam o Mozaia para 
              transformar suas interações com IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  Ver Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-semibold">Mozaia</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 Mozaia. Todos os direitos reservados. Desenvolvido em Moçambique.
            </p>
            <nav className="flex gap-4">
              <Link className="text-xs hover:underline" href="/privacy">
                Privacidade
              </Link>
              <Link className="text-xs hover:underline" href="/terms">
                Termos
              </Link>
              <Link className="text-xs hover:underline" href="/contact">
                Contato
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
