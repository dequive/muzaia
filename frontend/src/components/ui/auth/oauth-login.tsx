
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function OAuthLogin() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Verificar se há erro nos parâmetros
  const authError = searchParams.get('error')

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(provider)
      setError(null)

      const response = await fetch(`/api/auth/${provider}/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar autenticação')
      }

      const data = await response.json()
      
      if (data.success && data.auth_url) {
        // Redirecionar para URL de autorização
        window.location.href = data.auth_url
      } else {
        throw new Error('URL de autorização não recebida')
      }
    } catch (err) {
      console.error(`Error with ${provider} login:`, err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Entrar no Mozaia
        </CardTitle>
        <CardDescription className="text-center">
          Sistema inteligente de assistência jurídica
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(error || authError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || (authError === 'auth_error' ? 'Erro na autenticação. Tente novamente.' : authError)}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading !== null}
            className="w-full h-12 text-sm font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            variant="outline"
          >
            {loading === 'google' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continuar com Google
          </Button>

          <Button
            onClick={() => handleOAuthLogin('microsoft')}
            disabled={loading !== null}
            className="w-full h-12 text-sm font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            variant="outline"
          >
            {loading === 'microsoft' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" fill="#00BCF2" viewBox="0 0 23 23">
                <path d="M0 0h11v11H0z" />
                <path d="M12 0h11v11H12z" fill="#00BCF2" />
                <path d="M0 12h11v11H0z" fill="#00BCF2" />
                <path d="M12 12h11v11H12z" fill="#00BCF2" />
              </svg>
            )}
            Continuar com Microsoft
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Sistema seguro e confiável
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Ao continuar, aceita os{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Política de Privacidade
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
