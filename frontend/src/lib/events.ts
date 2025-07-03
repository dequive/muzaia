type EventCallback = (data: any) => void

interface EventSubscription {
  unsubscribe: () => void
}

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()
  
  on(event: string, callback: EventCallback): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    
    return {
      unsubscribe: () => this.off(event, callback)
    }
  }
  
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
    
    // Limpar set vazio
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event)
    }
  }
  
  emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }
  
  clear(): void {
    this.listeners.clear()
  }
}
