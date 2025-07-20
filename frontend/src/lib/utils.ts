
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

export function formatDate(
  date: Date | string | number,
  formatStr: string = 'dd/MM/yyyy'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (!isValid(dateObj)) {
      return 'Data inválida'
    }
    return format(dateObj, formatStr, { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (!isValid(dateObj)) {
      return 'Data inválida'
    }
    
    if (isToday(dateObj)) {
      return `Hoje às ${format(dateObj, 'HH:mm')}`
    }
    
    if (isYesterday(dateObj)) {
      return `Ontem às ${format(dateObj, 'HH:mm')}`
    }
    
    const daysDiff = differenceInDays(new Date(), dateObj)
    if (daysDiff <= 7) {
      return formatDistanceToNow(dateObj, { 
        addSuffix: true, 
        locale: ptBR 
      })
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

export function getTimeAgo(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (!isValid(dateObj)) {
      return 'Data inválida'
    }
    
    const now = new Date()
    const minutesDiff = differenceInMinutes(now, dateObj)
    const hoursDiff = differenceInHours(now, dateObj)
    const daysDiff = differenceInDays(now, dateObj)
    
    if (minutesDiff < 1) return 'Agora mesmo'
    if (minutesDiff < 60) return `${minutesDiff}m`
    if (hoursDiff < 24) return `${hoursDiff}h`
    if (daysDiff < 7) return `${daysDiff}d`
    
    return format(dateObj, 'dd/MM', { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

export function isDateInRange(
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    const startObj = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate)
    const endObj = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate)
    
    if (!isValid(dateObj) || !isValid(startObj) || !isValid(endObj)) {
      return false
    }
    
    const dateStart = startOfDay(dateObj)
    const rangeStart = startOfDay(startObj)
    const rangeEnd = endOfDay(endObj)
    
    return dateStart >= rangeStart && dateStart <= rangeEnd
  } catch {
    return false
  }
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

export function formatNumber(num: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(num)
}

export function formatCurrency(
  amount: number, 
  currency: string = 'MZN', 
  locale: string = 'pt-MZ'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatPercentage(
  value: number, 
  decimals: number = 1, 
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidPhone(phone: string): boolean {
  // Formato moçambicano: +258 XX XXX XXXX ou 8X XXX XXXX
  const phoneRegex = /^(\+258|258)?[\ ]?[8][0-9][\ ]?[0-9]{3}[\ ]?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends Record<string, any>, K extends keyof T>(
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

// =============================================================================
// FILE UTILITIES
// =============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const extension = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(extension)
}

// =============================================================================
// MISC UTILITIES
// =============================================================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      return Promise.resolve()
    } catch (err) {
      return Promise.reject(err)
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
