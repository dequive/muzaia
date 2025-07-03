import { EventBus } from '@/lib/events'

export const storeEvents = new EventBus()

// Exemplo de uso no store
export const createUISlice: StateCreator<UISlice> = (set) => ({
  updateUI: (updates) => {
    set((state) => {
      const newState = {
        ...state,
        ui: { ...state.ui, ...updates }
      }
      storeEvents.emit('ui:update', updates)
      return newState
    })
  }
})

// Exemplo de uso em componentes
useEffect(() => {
  const subscription = storeEvents.on('ui:update', (updates) => {
    console.log('UI updated:', updates)
  })
  
  return () => subscription.unsubscribe()
}, [])
