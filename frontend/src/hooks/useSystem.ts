'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  memory_usage: number
  cpu_usage: number
  active_connections: number
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  status: 'online' | 'offline'
  response_time: number
}

export function useSystem() {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    memory_usage: 0,
    cpu_usage: 0,
    active_connections: 0
  })

  const [models] = useState<ModelInfo[]>([
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      status: 'online',
      response_time: 200
    },
    {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'Anthropic',
      status: 'online',
      response_time: 180
    }
  ])

  // Simulate health check
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        memory_usage: Math.random() * 100,
        cpu_usage: Math.random() * 100,
        active_connections: Math.floor(Math.random() * 50)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    health,
    models,
    isLoading: false,
    error: null
  }
}