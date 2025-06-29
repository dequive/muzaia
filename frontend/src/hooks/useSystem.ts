// System monitoring hook
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/lib/api';
import { useState, useEffect } from 'react';

export function useSystem() {
  const [isOnline, setIsOnline] = useState(true);

  // Query para health check
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: systemApi.getHealth,
    refetchInterval: 30000, // Verificar a cada 30s
    retry: 3,
    retryDelay: 1000,
  });

  // Query para métricas
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: systemApi.getMetrics,
    refetchInterval: 60000, // Atualizar a cada 1min
    enabled: health?.status === 'healthy',
  });

  // Query para modelos disponíveis
  const {
    data: models = [],
    isLoading: modelsLoading,
    refetch: refetchModels,
  } = useQuery({
    queryKey: ['system', 'models'],
    queryFn: systemApi.getModels,
    refetchInterval: 300000, // Atualizar a cada 5min
    staleTime: 240000, // 4min
  });

  // Monitorar conectividade
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Status do sistema
  const systemStatus = {
    isHealthy: health?.status === 'healthy',
    isDegraded: health?.status === 'degraded',
    isUnhealthy: health?.status === 'unhealthy',
    isOnline,
    hasError: !!healthError,
  };

  return {
    // Dados
    health,
    metrics,
    models,
    systemStatus,
    isOnline,

    // Estados de loading
    healthLoading,
    metricsLoading,
    modelsLoading,

    // Funções
    refetchHealth,
    refetchMetrics,
    refetchModels,
    
    // Erros
    healthError,
  };
}
