
import { StateCreator } from 'zustand'

export interface AppError {
  code: string
  message: string
  metadata?: Record<string, any>
}

export interface ErrorState {
  code: string
  message: string
  metadata?: Record<string, any>
  timestamp: number
}

export interface ErrorSlice {
  error: ErrorState | null
  setError: (error: Error | AppError) => void
  clearError: () => void
}

export const createErrorSlice: StateCreator<ErrorSlice> = (set) => ({
  error: null,
  
  setError: (error: Error | AppError) => 
    set((state) => ({
      error: {
        code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
        message: error.message,
        metadata: 'metadata' in error ? error.metadata : undefined,
        timestamp: Date.now()
      }
    })),
    
  clearError: () => set({ error: null })
})
