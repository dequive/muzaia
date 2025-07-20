// =============================================================================
// MOZAIA FRONTEND - UTILITIES INDEX
// Sistema de utilidades modular e otimizado
// =============================================================================

// Re-exporta todas as utilidades mantendo compatibilidade
export * from './cn'
export * from './date'
export * from './validation'
export * from './string'
export * from './number'
export * from './file'
export * from './data'
export * from './constants'

// Core utilities
export const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}
export const retry = async (fn: Function, attempts: number = 3, delay: number = 1000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === attempts - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
export const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Mantém compatibilidade com importação direta
export { cn } from './cn'
export { formatDate, formatRelativeTime } from './date'
export { isValidEmail, isValidPassword } from './validation'
export { truncate, slugify } from './string'
export { formatCurrency, formatNumber } from './number'
