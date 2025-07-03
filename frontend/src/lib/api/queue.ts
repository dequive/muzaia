// Queue Manager com prioridade e retry
export class QueueManager {
  private queue: RequestQueue[] = []
  private processing = false
  private maxQueueSize = 100
  private retryDelay = 1000
  private maxRetries = 3

  // ... resto do código do QueueManager
}
