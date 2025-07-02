import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session, AuthState } from '@/types'

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      loading: true,
      initializing: true,

      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user 
        }),

      setSession: (session) => 
        set({ 
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user
        }),

      clear: () => 
        set({ 
          user: null, 
          session: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)
