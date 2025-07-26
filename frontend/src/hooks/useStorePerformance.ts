
export interface PerformanceMetrics {
  memoryUsage: number
  loadTime: number
  apiResponseTime: number
  errorCount: number
}

export interface StorePerformance {
  metrics: PerformanceMetrics
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  getMetrics: () => PerformanceMetrics
}

export const useStorePerformance = (): StorePerformance => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    loadTime: 0,
    apiResponseTime: 0,
    errorCount: 0
  })
  
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
  }, [])
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])
  
  const getMetrics = useCallback(() => metrics, [metrics])
  
  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMetrics
  }
}
