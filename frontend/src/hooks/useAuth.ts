import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuthStore } from '@/store/auth'
import type { User, Session } from '@/types'
import { toast } from 'react-hot-toast'

export function useAuth() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, session, isAuthenticated, loading, setSession } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  // Inicializar autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session?.user) {
          const userSession: Session = {
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
              metadata: session.user.user_metadata,
            },
            access_token: session.access_token,
            refresh_token: session.refresh_token!,
            expires_at: session.expires_at,
          }

          setSession(userSession)
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error)
      } finally {
        setInitializing(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userSession: Session = {
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
              metadata: session.user.user_metadata,
            },
            access_token: session.access_token,
            refresh_token: session.refresh_token!,
            expires_at: session.expires_at,
          }

          setSession(userSession)
          toast.success('Login realizado com sucesso!')
        }

        if (event === 'SIGNED_OUT') {
          setSession(null)
          router.push('/login')
          toast.success('Logout realizado com sucesso!')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setSession, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Erro no login:', error)
      toast.error(error.message || 'Erro ao fazer login')
      return { success: false, error: error.message }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) throw error

      toast.success('Conta criada com sucesso! Verifique seu email.')
      return { success: true, data }
    } catch (error: any) {
      console.error('Erro no registro:', error)
      toast.error(error.message || 'Erro ao criar conta')
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Erro no logout:', error)
      toast.error(error.message || 'Erro ao fazer logout')
      return { success: false, error: error.message }
    }
  }

  return {
    // Estado
    user,
    session,
    isAuthenticated,
    loading,
    initializing,

    // Funções
    signIn,
    signUp,
    signOut,
  }
}
