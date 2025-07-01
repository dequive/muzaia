// =============================================================================
// MOZAIA FRONTEND - NUMBER UTILITIES
// Formatação numérica e monetária com suporte ao contexto moçambicano
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

interface CurrencyFormatOptions {
  currency?: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
  showSymbol?: boolean
  showCode?: boolean
}

interface NumberFormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
}

interface PercentageFormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

// =============================================================================
// CORE NUMBER FUNCTIONS
// =============================================================================

/**
 * Formata número com opções localizadas
 */
export function formatNumber(
  value: number | string,
  options: NumberFormatOptions = {}
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return '0'

  const {
    locale = 'pt-MZ',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    notation = 'standard'
  } = options

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      notation
    }).format(num)
  } catch {
    // Fallback para formatação manual
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    })
  }
}

/**
 * Formata moeda com suporte ao Metical moçambicano
 */
export function formatCurrency(
  value: number | string,
  options: CurrencyFormatOptions = {}
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return 'MT 0,00'

  const {
    currency = 'MZN',
    locale = 'pt-MZ',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useGrouping = true,
    showSymbol = true,
    showCode = false
  } = options

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    })

    let formatted = formatter.format(num)

    // Personalizar para Metical moçambicano
    if (currency === 'MZN') {
      formatted = formatted.replace(/MZN|MTn/g, showSymbol ? 'MT' : '')
      if (showCode) formatted += ' MZN'
    }

    return formatted
  } catch {
    // Fallback manual para Metical
    const formatted = num.toLocaleString('pt-BR', {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    })
    
    return showSymbol ? `MT ${formatted}` : formatted
  }
}

/**
 * Formata percentagem
 */
export function formatPercentage(
  value: number | string,
  options: PercentageFormatOptions = {}
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return '0%'

  const {
    locale = 'pt-MZ',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options

  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(num / 100)
  } catch {
    return `${formatNumber(num, { maximumFractionDigits })}%`
  }
}

/**
 * Formata bytes para tamanho legível
 */
export function formatBytes(
  bytes: number,
  decimals: number = 2,
  binary: boolean = false
): string {
  if (bytes === 0) return '0 Bytes'

  const k = binary ? 1024 : 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = binary
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Formata número compacto (1K, 1M, 1B)
 */
export function formatCompactNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return '0'

  const absNum = Math.abs(num)
  
  if (absNum >= 1e9) {
    return `${formatNumber(num / 1e9, { maximumFractionDigits: 1 })}B`
  }
  if (absNum >= 1e6) {
    return `${formatNumber(num / 1e6, { maximumFractionDigits: 1 })}M`
  }
  if (absNum >= 1e3) {
    return `${formatNumber(num / 1e3, { maximumFractionDigits: 1 })}K`
  }
  
  return formatNumber(num, { maximumFractionDigits: 0 })
}

/**
 * Converte string para número
 */
export function parseNumber(value: string, locale: string = 'pt-MZ'): number {
  if (!value || typeof value !== 'string') return NaN

  // Remove espaços e normaliza separadores
  let cleanValue = value.trim()
  
  // Para português, vírgula é decimal e ponto é milhar
  if (locale.startsWith('pt')) {
    // Remove pontos de milhar
    cleanValue = cleanValue.replace(/\.(?=\d{3})/g, '')
    // Substitui vírgula decimal por ponto
    cleanValue = cleanValue.replace(',', '.')
  }
  
  // Remove caracteres não numéricos exceto ponto decimal
  cleanValue = cleanValue.replace(/[^\d.-]/g, '')
  
  return parseFloat(cleanValue)
}

/**
 * Converte moeda string para número
 */
export function parseCurrency(value: string): number {
  if (!value || typeof value !== 'string') return NaN

  // Remove símbolos de moeda comuns
  const cleanValue = value
    .replace(/[MT|MZN|MTn|$|€|£|¥|R\$]/g, '')
    .trim()

  return parseNumber(cleanValue)
}

/**
 * Arredonda para múltiplo específico
 */
export function roundToMultiple(value: number, multiple: number): number {
  return Math.round(value / multiple) * multiple
}

/**
 * Clamp número entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Interpola entre dois números
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * clamp(factor, 0, 1)
}

/**
 * Calcula percentagem entre dois valores
 */
export function percentage(current: number, total: number): number {
  if (total === 0) return 0
  return (current / total) * 100
}

/**
 * Gera número aleatório entre min e max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Gera inteiro aleatório entre min e max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Verifica se número é par
 */
export function isEven(num: number): boolean {
  return num % 2 === 0
}

/**
 * Verifica se número é ímpar
 */
export function isOdd(num: number): boolean {
  return num % 2 !== 0
}

/**
 * Calcula média de array de números
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Encontra mediana de array de números
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  
  return sorted[middle]
}

/**
 * Soma array de números
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0)
}

// =============================================================================
// MOZAMBIQUE SPECIFIC FUNCTIONS
// =============================================================================

/**
 * Formata valor em Metical moçambicano
 */
export function formatMetical(value: number | string): string {
  return formatCurrency(value, {
    currency: 'MZN',
    locale: 'pt-MZ',
    showSymbol: true,
    showCode: false
  })
}

/**
 * Formata número de telefone moçambicano
 */
export function formatMozambiquePhone(phone: string): string {
  if (!phone) return ''
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  // +258 XX XXX XXXX
  if (cleanPhone.length === 11 && cleanPhone.startsWith('258')) {
    return `+258 ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 8)} ${cleanPhone.slice(8)}`
  }
  
  // XX XXX XXXX
  if (cleanPhone.length === 9) {
    return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5)}`
  }
  
  return phone
}

/**
 * Calcula taxa de câmbio (placeholder para futura integração)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): number {
  // Por enquanto, retorna o valor original
  // TODO: Integrar com API de câmbio real
  if (rate) {
    return amount * rate
  }
  
  return amount
}
