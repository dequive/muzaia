// Metrics Manager com mais métricas e tipagem
export class MetricsManager {
  private metrics: RequestMetrics[] = []
  private maxMetrics = 1000
  private cacheHits = 0
  private cacheMisses = 0
  private totalRequests = 0
  private failedRequests = 0

  constructor() {
    // Reset métricas periodicamente
    if (typeof window !== 'undefined') {
      setInterval(() => this.resetCounters(), 3600000) // 1 hora
    }
  }

  // ... resto do código do MetricsManager
}
