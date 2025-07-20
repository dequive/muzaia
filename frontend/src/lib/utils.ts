
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

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return 'Data inválida'
  }
  
  return format(dateObj, pattern, { locale: ptBR })
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return 'Data inválida'
  }
  
  if (isToday(dateObj)) {
    return `hoje às ${format(dateObj, 'HH:mm', { locale: ptBR })}`
  }
  
  if (isYesterday(dateObj)) {
    return `ontem às ${format(dateObj, 'HH:mm', { locale: ptBR })}`
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ptBR 
  })
}

export function getTimeDifference(date1: Date, date2: Date): {
  days: number
  hours: number
  minutes: number
} {
  return {
    days: differenceInDays(date2, date1),
    hours: differenceInHours(date2, date1),
    minutes: differenceInMinutes(date2, date1)
  }
}

export function getDateRange(start: Date, end: Date) {
  return {
    start: startOfDay(start),
    end: endOfDay(end)
  }
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

export function formatCurrency(
  amount: number, 
  currency: string = 'MZN'
): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-MZ').format(num)
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+258|00258|258)?[1-9]\d{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function groupBy<T, K extends keyof any>(
  array: T[], 
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export function sortBy<T>(
  array: T[], 
  key: keyof T, 
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

export function pick<T, K extends keyof T>(
  obj: T, 
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function omit<T, K extends keyof T>(
  obj: T, 
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
