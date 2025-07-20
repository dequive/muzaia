
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheState {
  cache: Map<string, CacheEntry>
  set: <T>(key: string, data: T, ttl?: number) => void
  get: <T>(key: string) => T | null
  delete: (key: string) => void
  clear: () => void
  cleanup: () => void
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

export const useCacheStore = create<CacheState>()(
  devtools(
    persist(
      (set, get) => ({
        cache: new Map(),
        
        set: <T>(key: string, data: T, ttl = DEFAULT_TTL) => {
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
          }
          
          set((state) => {
            const newCache = new Map(state.cache)
            newCache.set(key, entry)
            return { cache: newCache }
          })
        },
        
        get: <T>(key: string): T | null => {
          const entry = get().cache.get(key) as CacheEntry<T> | undefined
          
          if (!entry) return null
          
          const now = Date.now()
          const isExpired = now - entry.timestamp > entry.ttl
          
          if (isExpired) {
            get().delete(key)
            return null
          }
          
          return entry.data
        },
        
        delete: (key: string) => {
          set((state) => {
            const newCache = new Map(state.cache)
            newCache.delete(key)
            return { cache: newCache }
          })
        },
        
        clear: () => {
          set({ cache: new Map() })
        },
        
        cleanup: () => {
          const now = Date.now()
          set((state) => {
            const newCache = new Map()
            
            for (const [key, entry] of state.cache.entries()) {
              const isExpired = now - entry.timestamp > entry.ttl
              if (!isExpired) {
                newCache.set(key, entry)
              }
            }
            
            return { cache: newCache }
          })
        },
      }),
      {
        name: 'cache-storage',
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name)
            if (!str) return null
            
            const { state } = JSON.parse(str)
            return {
              state: {
                ...state,
                cache: new Map(state.cache || []),
              },
            }
          },
          setItem: (name, value) => {
            const { state } = value
            const serializedValue = JSON.stringify({
              state: {
                ...state,
                cache: Array.from(state.cache.entries()),
              },
            })
            localStorage.setItem(name, serializedValue)
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    {
      name: 'cache-store',
    }
  )
)

// Cleanup automático a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().cleanup()
  }, 10 * 60 * 1000)
}
