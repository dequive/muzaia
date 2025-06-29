// Utility functions
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de datas
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(d)) {
    return format(d, 'HH:mm', { locale: ptBR })
  }
  
  if (isYesterday(d)) {
    return 'Ontem'
  }
  
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

// Formatação de números
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-MZ').format(num)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Validações
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

// Truncar texto
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Debounce
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

// Throttle
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Copiar para clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Erro ao copiar:', error)
    return false
  }
}

// Gerar ID único
export function generateId(): string {
  return crypto.randomUUID()
}

// Extrair iniciais do nome
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Cor baseada em string
export function getColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Local storage com tratamento de erro
export const localStorage = {
  get: (key: string) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  set: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  
  remove: (key: string) => {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  getJSON: <T>(key: string): T | null => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  setJSON: (key: string, value: any) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
}

// Detectar tipo de dispositivo
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Função para retry
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let attempt = 1
  
  while (attempt <= maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      
      await sleep(delay * attempt)
      attempt++
    }
  }
  
  throw new Error('Max attempts reached')
}
