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

// Mantém compatibilidade com importação direta
export { cn } from './cn'
export { formatDate, formatRelativeTime } from './date'
export { isValidEmail, isValidPassword } from './validation'
export { truncate, slugify } from './string'
export { formatCurrency, formatNumber } from './number'
