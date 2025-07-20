
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// =============================================================================
// CORE UTILITIES
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

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

/**
 * Formata uma data de acordo com o padrão brasileiro
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'dd/MM/yyyy'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
  
  if (!isValid(dateObj)) {
    return 'Data inválida'
  }
  
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Formata tempo relativo (ex: "há 2 horas")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
  
  if (!isValid(dateObj)) {
    return 'Data inválida'
  }
  
  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: ptBR 
    })
  }
  
  if (isYesterday(dateObj)) {
    return 'Ontem'
  }
  
  const daysDiff = differenceInDays(new Date(), dateObj)
  
  if (daysDiff <= 7) {
    return `Há ${daysDiff} dia${daysDiff > 1 ? 's' : ''}`
  }
  
  return formatDate(dateObj)
}

/**
 * Verifica se uma data é hoje
 */
export function isDateToday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(dateObj) && isToday(dateObj)
}

/**
 * Verifica se uma data é ontem
 */
export function isDateYesterday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(dateObj) && isYesterday(dateObj)
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Trunca texto com reticências
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Converte texto para slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida senha forte
 */
export function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres, pelo menos 1 letra maiúscula, 1 minúscula, 1 número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Formata número como moeda (Metical moçambicano)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN'
  }).format(amount)
}

/**
 * Formata número com separadores
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-MZ').format(num)
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const
