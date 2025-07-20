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

/**
 * Combina classes CSS usando clsx e tailwind-merge
 * 
 * @param inputs - Classes CSS a serem combinadas
 * @returns String de classes CSS otimizada
 * 
 * @example
 * ```ts
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': true })
 * // 'px-4 py-2 bg-blue-500 text-white'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// DATE & TIME UTILITIES
// =============================================================================

/**
 * Tipo para entrada de data flexível
 */
type DateInput = string | Date | number

/**
 * Converte entrada em objeto Date válido
 */
function toDate(date: DateInput): Date {
  if (typeof date === 'string') {
    // Tenta parsear ISO string primeiro
    const isoDate = parseISO(date)
    return isValid(isoDate) ? isoDate : new Date(date)
  }
  if (typeof date === 'number') {
    return new Date(date)
  }
  return date
}

/**
 * Formata data de forma inteligente baseada na proximidade atual
 * 
 * @param date - Data a ser formatada
 * @param options - Opções de formatação
 * @returns Data formatada
 * 
 * @example
 * ```ts
 * formatDate(new Date()) // '14:30'
 * formatDate('2024-01-01') // '01/01/2024'
 * formatDate(yesterday) // 'Ontem'
 * ```
 */
export function formatDate(
  date: DateInput,
  options: {
    includeTime?: boolean
    longFormat?: boolean
    relative?: boolean
  } = {}
): string {
  const d = toDate(date)
  
  if (!isValid(d)) {
    return 'Data inválida'
  }
  
  const { includeTime = false, longFormat = false, relative = true } = options
  
  if (relative) {
    if (isToday(d)) {
      return includeTime ? format(d, 'HH:mm', { locale: ptBR }) : 'Hoje'
    }
    
    if (isYesterday(d)) {
      return includeTime ? `Ontem às ${format(d, 'HH:mm', { locale: ptBR })}` : 'Ontem'
    }
    
    // Se for há menos de 7 dias, mostrar dia da semana
    const daysAgo = differenceInDays(new Date(), d)
    if (daysAgo <= 7 && daysAgo > 0) {
      const dayFormat = longFormat ? 'EEEE' : 'EEE'
      const timeFormat = includeTime ? ` às ${format(d, 'HH:mm', { locale: ptBR })}` : ''
      return format(d, dayFormat, { locale: ptBR }) + timeFormat
    }
  }
  
  const dateFormat = longFormat ? 'dd \'de\' MMMM \'de\' yyyy' : 'dd/MM/yyyy'
  const timeFormat = includeTime ? ` às ${format(d, 'HH:mm', { locale: ptBR })}` : ''
  
  return format(d, dateFormat, { locale: ptBR }) + timeFormat
}

/**
 * Formata tempo relativo com mais precisão
 */
export function formatRelativeTime(
  date: DateInput,
  options: {
    precision?: 'auto' | 'minute' | 'hour' | 'day'
    suffix?: boolean
  } = {}
): string {
  const d = toDate(date)
  const now = new Date()
  const { precision = 'auto', suffix = true } = options
  
  if (!isValid(d)) {
    return 'Data inválida'
  }
  
  const minutes = differenceInMinutes(now, d)
  const hours = differenceInHours(now, d)
  const days = differenceInDays(now, d)
  
  // Precisão automática baseada na diferença
  if (precision === 'auto') {
    if (Math.abs(minutes) < 60) {
      if (Math.abs(minutes) < 1) {
        return 'agora mesmo'
      }
      return `${Math.abs(minutes)} min${suffix ? (minutes > 0 ? ' atrás' : ' à frente') : ''}`
    }
    
    if (Math.abs(hours) < 24) {
      return `${Math.abs(hours)} h${suffix ? (hours > 0 ? ' atrás' : ' à frente') : ''}`
    }
    
    if (Math.abs(days) < 30) {
      return `${Math.abs(days)} d${suffix ? (days > 0 ? ' atrás' : ' à frente') : ''}`
    }
  }
  
  return formatDistanceToNow(d, { addSuffix: suffix, locale: ptBR })
}

/**
 * Verifica se uma data está dentro de um intervalo
 */
export function isDateInRange(
  date: DateInput,
  start: DateInput,
  end: DateInput
): boolean {
  const d = toDate(date)
  const s = startOfDay(toDate(start))
  const e = endOfDay(toDate(end))
  
  return d >= s && d <= e
}

/**
 * Calcula a idade a partir de uma data de nascimento
 */
export function calculateAge(birthDate: DateInput): number {
  const birth = toDate(birthDate)
  const today = new Date()
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// =============================================================================
// NUMBER & CURRENCY UTILITIES
// =============================================================================

/**
 * Opções para formatação de números
 */
interface NumberFormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

/**
 * Formata números com opções flexíveis
 */
export function formatNumber(
  num: number | string,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'pt-MZ',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true
  } = options
  
  const number = typeof num === 'string' ? parseFloat(num) : num
  
  if (isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  }).format(number)
}

/**
 * Formata números grandes com sufixos (K, M, B)
 */
export function formatCompactNumber(
  num: number,
  options: { locale?: string; notation?: 'compact' | 'scientific' | 'engineering' } = {}
): string {
  const { locale = 'pt-MZ', notation = 'compact' } = options
  
  return new Intl.NumberFormat(locale, {
    notation,
    compactDisplay: 'short'
  }).format(num)
}

/**
 * Formata bytes com precisão automática
 */
export function formatBytes(
  bytes: number,
  options: { decimals?: number; binary?: boolean } = {}
): string {
  const { decimals = 2, binary = false } = options
  
  if (bytes === 0) return '0 Bytes'
  
  const k = binary ? 1024 : 1000
  const sizes = binary 
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  
  return `${value.toFixed(decimals)} ${sizes[i]}`
}

/**
 * Formata moeda com suporte a múltiplas moedas
 */
export function formatCurrency(
  amount: number | string,
  options: {
    currency?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    currency = 'USD',
    locale = 'pt-MZ',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options
  
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(value)) {
    return formatCurrency(0, options)
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value)
}

/**
 * Formata porcentagem
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number; locale?: string } = {}
): string {
  const { decimals = 1, locale = 'pt-MZ' } = options
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validação robusta de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim().toLowerCase())
}

/**
 * Validação de senha com critérios customizáveis
 */
export function isValidPassword(
  password: string,
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSpecialChars?: boolean
  } = {}
): { isValid: boolean; errors: string[] } {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options
  
  const errors: string[] = []
  
  if (password.length < minLength) {
    errors.push(`Deve ter pelo menos ${minLength} caracteres`)
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Deve conter pelo menos uma letra maiúscula')
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Deve conter pelo menos uma letra minúscula')
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Deve conter pelo menos um número')
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Deve conter pelo menos um caractere especial')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validação de URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validação de CPF (Brasil)
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '')
  
  if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) {
    return false
  }
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  
  let checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cleanCpf.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  
  checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cleanCpf.charAt(10))) return false
  
  return true
}

/**
 * Validação de telefone (formato internacional)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  const cleanPhone = phone.replace(/\D/g, '')
  return phoneRegex.test(cleanPhone)
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Capitaliza a primeira letra de uma string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Converte string para slug (URL-friendly)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Trunca texto com opções avançadas
 */
export function truncate(
  text: string,
  options: {
    length?: number
    suffix?: string
    preserveWords?: boolean
  } = {}
): string {
  const { length = 100, suffix = '...', preserveWords = true } = options
  
  if (text.length <= length) return text
  
  if (preserveWords) {
    const truncated = text.slice(0, length)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.slice(0, lastSpace) + suffix : truncated + suffix
  }
  
  return text.slice(0, length) + suffix
}

/**
 * Trunca texto simples com reticências
 */
export function truncateSimple(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Converte para camelCase
 */
export function toCamelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
}

/**
 * Converte para snake_case
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

/**
 * Remove acentos de texto
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Gera slug amigável para URLs
 */
export function generateSlug(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extrai iniciais do nome
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, maxInitials)
}

/**
 * Mascara texto parcialmente (útil para emails, telefones)
 */
export function maskText(
  text: string,
  options: {
    start?: number
    end?: number
    maskChar?: string
  } = {}
): string {
  const { start = 3, end = 3, maskChar = '*' } = options
  
  if (text.length <= start + end) {
    return maskChar.repeat(text.length)
  }
  
  const startPart = text.slice(0, start)
  const endPart = text.slice(-end)
  const maskLength = text.length - start - end
  
  return startPart + maskChar.repeat(maskLength) + endPart
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Debounce com cancelamento
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }
  
  return debounced as T & { cancel: () => void }
}

/**
 * Throttle com cancelamento
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle: boolean = false
  let timeout: NodeJS.Timeout | null = null
  
  const throttled = (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      timeout = setTimeout(() => (inThrottle = false), limit)
    }
  }
  
  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      inThrottle = false
    }
  }
  
  return throttled as T & { cancel: () => void }
}

/**
 * Memoização simples com TTL
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  options: { ttl?: number; maxSize?: number } = {}
): T & { clear: () => void } {
  const { ttl = Infinity, maxSize = Infinity } = options
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>()
  
  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp < ttl)) {
      return cached.value
    }
    
    const result = func(...args)
    
    // Limpar cache se exceder tamanho máximo
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    cache.set(key, { value: result, timestamp: now })
    return result
  }
  
  memoized.clear = () => cache.clear()
  
  return memoized as T & { clear: () => void }
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Sleep com Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry com backoff exponencial
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
    exponential?: boolean
    jitter?: boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponential = true,
    jitter = true
  } = options
  
  let attempt = 1
  
  while (attempt <= maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      
      let delay = exponential ? baseDelay * Math.pow(2, attempt - 1) : baseDelay
      delay = Math.min(delay, maxDelay)
      
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }
      
      await sleep(delay)
      attempt++
    }
  }
  
  throw new Error('Max attempts reached')
}

/**
 * Timeout para Promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}

/**
 * Executa Promises em lotes
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize?: number; delay?: number } = {}
): Promise<R[]> {
  const { batchSize = 10, delay = 0 } = options
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    
    if (delay > 0 && i + batchSize < items.length) {
      await sleep(delay)
    }
  }
  
  return results
}

// =============================================================================
// CLIPBOARD & FILE UTILITIES
// =============================================================================

/**
 * Copia texto para clipboard com fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback para navegadores antigos
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch (error) {
    console.error('Erro ao copiar:', error)
    return false
  }
}

/**
 * Lê texto do clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard) {
      return await navigator.clipboard.readText()
    }
    return null
  } catch (error) {
    console.error('Erro ao ler clipboard:', error)
    return null
  }
}

/**
 * Download de arquivo
 */
export function downloadFile(
  data: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Converte File para base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// =============================================================================
// ID GENERATION UTILITIES
// =============================================================================

/**
 * Gera UUID v4
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback para ambientes sem crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Gera ID curto (nanoid style)
 */
export function generateShortId(length: number = 8): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  
  return result
}

/**
 * Gera hash simples de string
 */
export function simpleHash(str: string): number {
  let hash = 0
  if (str.length === 0) return hash
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash)
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Gera cor baseada em string (mais consistente)
 */
export function getColorFromString(
  str: string,
  options: {
    saturation?: number
    lightness?: number
    format?: 'hsl' | 'hex' | 'rgb'
  } = {}
): string {
  const { saturation = 70, lightness = 50, format = 'hsl' } = options
  
  const hash = simpleHash(str)
  const hue = hash % 360
  
  if (format === 'hsl') {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }
  
  // Converter HSL para RGB
  const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
  const m = lightness / 100 - c / 2
  
  let r = 0, g = 0, b = 0
  
  if (0 <= hue && hue < 60) {
    r = c; g = x; b = 0
  } else if (60 <= hue && hue < 120) {
    r = x; g = c; b = 0
  } else if (120 <= hue && hue < 180) {
    r = 0; g = c; b = x
  } else if (180 <= hue && hue < 240) {
    r = 0; g = x; b = c
  } else if (240 <= hue && hue < 300) {
    r = x; g = 0; b = c
  } else if (300 <= hue && hue < 360) {
    r = c; g = 0; b = x
  }
  
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  
  if (format === 'rgb') {
    return `rgb(${r}, ${g}, ${b})`
  }
  
  // Formato hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Determina se uma cor é clara ou escura
 */
export function isLightColor(color: string): boolean {
  // Remove # se presente
  const hex = color.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5
}

// =============================================================================
// DEVICE & BROWSER UTILITIES
// =============================================================================

/**
 * Detecta tipo de dispositivo com mais precisão
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Verifica se é um dispositivo móvel pelo user agent
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  if (isMobile || width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Detecta se é dispositivo touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Detecta se está em modo escuro do sistema
 */
export function isSystemDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Detecta suporte a webP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// =============================================================================
// ENHANCED LOCAL STORAGE
// =============================================================================

/**
 * LocalStorage aprimorado com tipagem e TTL
 */
export const localStorage = {
  /**
   * Obtém item do localStorage
   */
  get: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  /**
   * Define item no localStorage
   */
  set: (key: string, value: string): boolean => {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Remove item do localStorage
   */
  remove: (key: string): boolean => {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Obtém objeto JSON do localStorage
   */
  getJSON: <T>(key: string): T | null => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  /**
   * Define objeto JSON no localStorage
   */
  setJSON: (key: string, value: any): boolean => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Obtém item com TTL
   */
  getWithTTL: <T>(key: string): T | null => {
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return null
      
      const data = JSON.parse(item)
      
      if (data.expiry && Date.now() > data.expiry) {
        window.localStorage.removeItem(key)
        return null
      }
      
      return data.value
    } catch {
      return null
    }
  },
  
  /**
   * Define item com TTL
   */
  setWithTTL: (key: string, value: any, ttlMs: number): boolean => {
    try {
      const data = {
        value,
        expiry: Date.now() + ttlMs
      }
      window.localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Limpa todos os itens
   */
  clear: (): boolean => {
    try {
      window.localStorage.clear()
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Obtém tamanho usado do localStorage
   */
  getSize: (): number => {
    try {
      return JSON.stringify(window.localStorage).length
    } catch {
      return 0
    }
  }
}

// =============================================================================
// ARRAY & OBJECT UTILITIES
// =============================================================================

/**
 * Remove duplicatas de array baseado em propriedade
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
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
    const value = String(item[key])
    groups[value] = groups[value] || []
    groups[value].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Ordena array por múltiplas propriedades
 */
export function sortBy<T>(
  array: T[],
  keys: (keyof T | ((item: T) => any))[],
  orders: ('asc' | 'desc')[] = []
): T[] {
  return [...array].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const order = orders[i] || 'asc'
      
      const aVal = typeof key === 'function' ? key(a) : a[key]
      const bVal = typeof key === 'function' ? key(b) : b[key]
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

/**
 * Deep clone de objeto
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

/**
 * Merge profundo de objetos
 */
export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target
  const source = sources.shift()
  
  if (source && typeof target === 'object' && typeof source === 'object') {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMerge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  
  return deepMerge(target, ...sources)
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  DateInput,
  NumberFormatOptions
}
