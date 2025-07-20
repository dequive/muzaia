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
import { ptBR } from 'date-fns/locale/pt-BR'

// =============================================================================
// CORE UTILITIES
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique ID
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Get user initials from name or email
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

export function formatDate(date: string | Date, formatString: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Data inválida'
  return format(dateObj, formatString, { locale: ptBR })
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Data inválida'

  if (isToday(dateObj)) {
    return `hoje às ${format(dateObj, 'HH:mm')}`
  }

  if (isYesterday(dateObj)) {
    return `ontem às ${format(dateObj, 'HH:mm')}`
  }

  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ptBR 
  })
}

export function getTimeAgo(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Data inválida'

  const now = new Date()
  const diffInMinutes = differenceInMinutes(now, dateObj)
  const diffInHours = differenceInHours(now, dateObj)
  const diffInDays = differenceInDays(now, dateObj)

  if (diffInMinutes < 1) return 'agora mesmo'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInHours < 24) return `${diffInHours}h`
  if (diffInDays < 7) return `${diffInDays}d`

  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
}

export function isValidDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isValid(dateObj)
}

export function getDateRange(date: Date) {
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  }
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }

  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value / 100)
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
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
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// =============================================================================
// URL UTILITIES
// =============================================================================

export function buildUrl(base: string, params: Record<string, string | number>): string {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// =============================================================================
// BROWSER UTILITIES
// =============================================================================

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return Promise.resolve()
  } catch (err) {
    document.body.removeChild(textArea)
    return Promise.reject(err)
  }
}

export function downloadFile(data: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

export function setLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue ?? null
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue ?? null
  }
}

export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
}