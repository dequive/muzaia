import { StateCreator } from 'zustand'
import type { AuthSlice, User, Session } from '@/types'

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // Estado
  user: null,
  session: null,
  isAuthenticated: false,
  
  // Ações
  setUser: (user: User | null) => 
    set((state) => ({
      user,
      isAuthenticated: !!user
    })),
    
  setSession: (session: Session | null) =>
    set((state) => ({
      session,
      user: session?.user || null,
      isAuthenticated: !!session
    }))
})
