import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setUser: (user: User | null) => void
  setTokens: (access: string | null, refresh: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (access, refresh) => set({ 
        accessToken: access, 
        refreshToken: refresh 
      }),
      clear: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken 
      }),
    }
  )
)
