import { StateCreator } from 'zustand'
import { AppError } from '@/lib/error'
import type { ErrorState } from '@/lib/error'

export const createErrorSlice: StateCreator<ErrorSlice> = (set) => ({
  error: null,
  
  setError: (error: Error) => 
    set((state) => ({
      error: {
        code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
        message: error.message,
        metadata: error instanceof AppError ? error.metadata : undefined,
        timestamp: Date.now()
      }
    })),
    
  clearError: () => set({ error: null })
})
