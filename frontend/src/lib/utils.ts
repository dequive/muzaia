import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  format, 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  parseISO, 
  isValid, 
  startOfDay, 
  endOfDay, 
  differenceInDays, 
  differenceInHours, 
  differenceInMinutes 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// CORE UTILITIES
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy') => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'Data inválida'
  return format(parsedDate, formatStr, { locale: ptBR })
}

export const formatRelativeTime = (date: string | Date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'Data inválida'
  return formatDistanceToNow(parsedDate, { addSuffix: true, locale: ptBR })
}

export const isDateToday = (date: string | Date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return isValid(parsedDate) && isToday(parsedDate)
}

export const isDateYesterday = (date: string | Date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return isValid(parsedDate) && isYesterday(parsedDate)
}

export const getDayRange = (date: Date = new Date()) => {
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  }
}

export const getTimeDifference = (date1: Date, date2: Date) => {
  return {
    days: differenceInDays(date2, date1),
    hours: differenceInHours(date2, date1),
    minutes: differenceInMinutes(date2, date1)
  }
}

/**
 * Formata datetime para chat (ex: "14:30" ou "Ontem 14:30")
 */
export function formatChatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return ''
  }

  if (isDateToday(dateObj)) {
    return format(dateObj, 'HH:mm')
  }

  if (isDateYesterday(dateObj)) {
    return `Ontem ${format(dateObj, 'HH:mm')}`
  }

  const daysDiff = differenceInDays(new Date(), dateObj)

  if (daysDiff < 7) {
    return format(dateObj, 'EEEE HH:mm', { locale: ptBR })
  }

  return format(dateObj, 'dd/MM HH:mm')
}

/**
 * Obtém informações sobre duração entre datas
 */
export function getDateDuration(startDate: Date | string, endDate: Date | string = new Date()) {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

  if (!isValid(start) || !isValid(end)) {
    return null
  }

  const days = differenceInDays(end, start)
  const hours = differenceInHours(end, start)
  const minutes = differenceInMinutes(end, start)

  return { days, hours, minutes }
}

/**
 * Verifica se uma data está dentro de um range
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

  if (!isValid(dateObj) || !isValid(start) || !isValid(end)) {
    return false
  }

  return dateObj >= startOfDay(start) && dateObj <= endOfDay(end)
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Trunca um texto com ellipsis
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Converte primeira letra para maiúscula
 */
export function capitalize(text: string) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Converte texto para slug (URL-friendly)
 */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Formata números para display brasileiro
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('pt-BR', options).format(value)
}

/**
 * Formata valores monetários
 */
export function formatCurrency(value: number, currency = 'BRL') {
  return formatNumber(value, {
    style: 'currency',
    currency,
  })
}

/**
 * Formata percentuais
 */
export function formatPercent(value: number, decimals = 2) {
  return formatNumber(value / 100, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Valida se é email válido
 */
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se é URL válida
 */
export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Valida se é JSON válido
 */
export function isValidJson(str: string) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Remove itens duplicados de um array
 */
export function uniqueArray<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)]
  }

  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * Agrupa array por propriedade
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Remove propriedades undefined de um objeto
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>
}

/**
 * Deep merge de objetos
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]!)
    } else {
      result[key] = source[key]!
    }
  }

  return result
}

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Safe localStorage access
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue ?? null
    } catch {
      return defaultValue ?? null
    }
  },

  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Erro desconhecido'
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [fallback ?? null, error instanceof Error ? error : new Error(String(error))]
  }
}