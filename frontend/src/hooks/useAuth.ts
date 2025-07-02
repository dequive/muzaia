import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import type { User, Session, AuthResponse } from '@/types'

export function useAuth() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, session, setUser, setSession, clear } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session) {
          setSession(session)
          setUser(session.user)
        }
      } catch (error: any) {
        console.error('Erro na inicialização da auth:', error)
        toast.error(error.message)
      } finally {
        setInitializing(false)
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setSession(session)
          setUser(session?.user || null)
          toast.success('Login realizado com sucesso!')
          router.push('/dashboard')
        }

        if (event === 'SIGNED_OUT') {
          clear()
          router.push('/login')
          toast.success('Logout realizado com sucesso!')
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setSession, setUser, clear, router])

  const signIn = useCallback(async (
    email: string, 
    password: string
  ): Promise<AuthResponse> => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Erro no login:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const signUp = useCallback(async (
    email: string, 
    password: string,
    metadata?: Record<string, any>
  ): Promise<AuthResponse> => {
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (error) throw error

      toast.success('Conta criada com sucesso! Verifique seu email.')
      return { success: true, data }
    } catch (error: any) {
      console.error('Erro no registro:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const signOut = useCallback(async (): Promise<AuthResponse> => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Erro no logout:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Email de recuperação enviado!')
      return { success: true }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    user,
    session,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
