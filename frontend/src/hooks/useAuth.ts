import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuthStore } from '@/store/auth'
import type { 
  User, 
  Session, 
  AuthResponse, 
  SupabaseAuthStateChange,
  SupabaseSession
} from '@/types'
import { mapSupabaseUser, mapSupabaseSession } from '@/types'
import { toast } from 'react-hot-toast'

export function useAuth() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, session, isAuthenticated, setSession } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: supabaseSession }, error } = 
          await supabase.auth.getSession()
        
        if (error) throw error

        if (supabaseSession) {
          const mappedSession = mapSupabaseSession(supabaseSession)
          setSession(mappedSession)
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error)
      } finally {
        setInitializing(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (event === 'SIGNED_IN' && supabaseSession) {
          const mappedSession = mapSupabaseSession(supabaseSession)
          setSession(mappedSession)
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

  // ... resto do código
}
