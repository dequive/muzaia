// =============================================================================
// MOZAIA FRONTEND - STRING UTILITIES
// Manipulação avançada de strings com suporte ao português
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

interface TruncateOptions {
  length?: number
  suffix?: string
  preserveWords?: boolean
  separator?: string
}

interface SlugifyOptions {
  lowercase?: boolean
  separator?: string
  maxLength?: number
  preserveCase?: boolean
}

interface HighlightOptions {
  caseSensitive?: boolean
  wholeWords?: boolean
  className?: string
}

// =============================================================================
// CORE STRING FUNCTIONS
// =============================================================================

/**
 * Trunca texto com opções avançadas
 */
export function truncate(
  text: string,
  options: TruncateOptions = {}
): string {
  if (!text || typeof text !== 'string') return ''

  const { 
    length = 100, 
    suffix = '...', 
    preserveWords = true,
    separator = ' '
  } = options

  if (text.length <= length) return text

  let truncated = text.slice(0, length)

  if (preserveWords) {
    const lastSeparator = truncated.lastIndexOf(separator)
    if (lastSeparator > 0) {
      truncated = truncated.slice(0, lastSeparator)
    }
  }

  return truncated + suffix
}

/**
 * Capitaliza primeira letra
 */
export function capitalizeFirst(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Capitaliza cada palavra
 */
export function capitalizeWords(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .split(' ')
    .map(word => {
      // Não capitalizar preposições curtas
      const lowercase = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'a', 'o']
      return lowercase.includes(word.toLowerCase()) && word.length <= 3 
        ? word.toLowerCase() 
        : capitalizeFirst(word)
    })
    .join(' ')
}

/**
 * Formata nome para exibição
 */
export function formatDisplayName(name: string): string {
  if (!name || typeof name !== 'string') return ''
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ')
}

/**
 * Extrai iniciais do nome
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name || typeof name !== 'string') return ''
  
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

/**
 * Cria slug para URLs amigáveis
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  if (!text || typeof text !== 'string') return ''

  const {
    lowercase = true,
    separator = '-',
    maxLength = 100,
    preserveCase = false
  } = options

  let slug = text.trim()

  // Normalizar acentos
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos

  // Converter case se necessário
  if (lowercase && !preserveCase) {
    slug = slug.toLowerCase()
  }

  // Substituir caracteres especiais
  slug = slug
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, separator) // Substitui espaços
    .replace(/[_-]+/g, separator) // Remove separadores duplos
    .replace(new RegExp(`^[${separator}]+|[${separator}]+$`, 'g'), '') // Remove separadores das bordas

  // Limitar comprimento
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(new RegExp(`[${separator}]+$`), '')
  }

  return slug
}

/**
 * Remove acentos de string
 */
export function removeAccents(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Converte para kebab-case
 */
export function toKebabCase(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * Converte para camelCase
 */
export function toCamelCase(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * Converte para PascalCase
 */
export function toPascalCase(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '')
}

/**
 * Limpa string removendo espaços extras e caracteres especiais
 */
export function cleanString(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .replace(/[^\w\s\-_.]/g, '') // Remove caracteres especiais exceto alguns
}

/**
 * Destaca texto com markup HTML
 */
export function highlightText(
  text: string, 
  query: string, 
  options: HighlightOptions = {}
): string {
  if (!text || !query || typeof text !== 'string' || typeof query !== 'string') {
    return text
  }

  const {
    caseSensitive = false,
    wholeWords = false,
    className = 'highlight'
  } = options

  let flags = 'g'
  if (!caseSensitive) flags += 'i'

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = wholeWords ? `\\b${escapedQuery}\\b` : escapedQuery
  const regex = new RegExp(pattern, flags)

  return text.replace(regex, match => `<mark class="${className}">${match}</mark>`)
}

/**
 * Conta palavras em texto
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
}

/**
 * Conta caracteres excluindo espaços
 */
export function countCharacters(text: string, includeSpaces: boolean = true): number {
  if (!text || typeof text !== 'string') return 0
  
  return includeSpaces ? text.length : text.replace(/\s/g, '').length
}

/**
 * Estima tempo de leitura
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): string {
  const wordCount = countWords(text)
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  
  if (minutes === 1) return '1 minuto'
  if (minutes < 60) return `${minutes} minutos`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 1 && remainingMinutes === 0) return '1 hora'
  if (remainingMinutes === 0) return `${hours} horas`
  
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Mascarar texto (ex: email, telefone)
 */
export function maskText(
  text: string, 
  visibleStart: number = 2, 
  visibleEnd: number = 2, 
  maskChar: string = '*'
): string {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= visibleStart + visibleEnd) return text
  
  const start = text.slice(0, visibleStart)
  const end = text.slice(-visibleEnd)
  const middle = maskChar.repeat(text.length - visibleStart - visibleEnd)
  
  return start + middle + end
}

/**
 * Gera string aleatória
 */
export function generateRandomString(
  length: number = 8, 
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

// =============================================================================
// PORTUGUESE SPECIFIC FUNCTIONS
// =============================================================================

/**
 * Plural inteligente para português
 */
export function pluralize(word: string, count: number): string {
  if (count === 1) return word
  
  // Regras básicas do português
  if (word.endsWith('ão')) {
    if (word.endsWith('ção')) return word.replace('ção', 'ções')
    if (word.endsWith('são')) return word.replace('são', 'sões')
    return word.replace('ão', 'ões')
  }
  
  if (word.endsWith('m')) return word.replace('m', 'ns')
  if (word.endsWith('r') || word.endsWith('s') || word.endsWith('z')) return word + 'es'
  
  return word + 's'
}

/**
 * Formata número com palavra (ex: "1 item", "2 itens")
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural || pluralize(singular, count))
  return `${count} ${word}`
}
