
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Mock authentication - em produção usar JWT
      if (credentials.email === 'admin@mozaia.org' && credentials.password === 'admin123') {
        if (step === 'credentials') {
          setStep('twoFactor')
        } else if (credentials.twoFactorCode === '123456') {
          // Simular sucesso de login
          localStorage.setItem('admin_token', 'mock_admin_token')
          router.push('/admin')
        } else {
          setError('Código 2FA inválido')
        }
      } else {
        setError('Credenciais inválidas')
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-400">
            Acesso restrito - Administradores Mozaia
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">
                {step === 'credentials' ? 'Autenticação' : 'Verificação 2FA'}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-red-500 text-red-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Área Restrita
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {step === 'credentials' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Administrativo
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        value={credentials.email}
                        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="admin@mozaia.org"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-gray-300">
                    Código 2FA
                  </Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    value={credentials.twoFactorCode}
                    onChange={(e) => setCredentials({...credentials, twoFactorCode: e.target.value})}
                    className="text-center text-lg tracking-wider bg-gray-700 border-gray-600 text-white"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-400 text-center">
                    Digite o código de 6 dígitos do seu aplicativo autenticador
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'A verificar...' : (
                  step === 'credentials' ? 'Continuar' : 'Entrar'
                )}
              </Button>
            </form>

            {step === 'twoFactor' && (
              <Button 
                variant="ghost" 
                onClick={() => setStep('credentials')}
                className="w-full text-gray-400 hover:text-white"
              >
                Voltar
              </Button>
            )}

            {/* Informações de desenvolvimento */}
            <div className="mt-6 p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">
                <strong>Ambiente de Desenvolvimento:</strong>
              </p>
              <p className="text-xs text-gray-300">
                Email: admin@mozaia.org<br />
                Senha: admin123<br />
                2FA: 123456
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades do sistema */}
        <Card className="mt-6 bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Funcionalidades Administrativas:
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Gestão de técnicos jurídicos e advogados</li>
              <li>• Aprovação e validação de credenciais</li>
              <li>• Controle de acesso e permissões</li>
              <li>• Logs de auditoria e atividade</li>
              <li>• Métricas de performance do sistema</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
