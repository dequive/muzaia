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
  differenceInMinutes,
  addDays,
  addHours,
  addMinutes,
  isFuture,
  isPast
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =============================================================================
// TYPES
// =============================================================================

type DateInput = string | Date | number

interface DateFormatOptions {
  includeTime?: boolean
  longFormat?: boolean
  relative?: boolean
  locale?: 'pt-PT' | 'en-US'
}

interface RelativeTimeOptions {
  addSuffix?: boolean
  includeSeconds?: boolean
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Converte entrada em objeto Date válido
 */
function toDate(date: DateInput): Date {
  if (typeof date === 'string') {
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
 */
export function formatDate(
  date: DateInput,
  options: DateFormatOptions = {}
): string {
  const d = toDate(date)
  
  if (!isValid(d)) {
    return 'Data inválida'
  }
  
  const { 
    includeTime = false, 
    longFormat = false, 
    relative = true,
    locale = 'pt-BR'
  } = options
  
  const localeObj = locale === 'pt-BR' ? ptBR : undefined
  
  if (relative) {
    if (isToday(d)) {
      return includeTime ? format(d, 'HH:mm', { locale: localeObj }) : 'Hoje'
    }
    
    if (isYesterday(d)) {
      return includeTime ? `Ontem às ${format(d, 'HH:mm', { locale: localeObj })}` : 'Ontem'
    }
    
    const daysAgo = differenceInDays(new Date(), d)
    if (daysAgo <= 7 && daysAgo > 0) {
      const dayFormat = longFormat ? 'EEEE' : 'EEE'
      const timeFormat = includeTime ? ` às ${format(d, 'HH:mm', { locale: localeObj })}` : ''
      return format(d, dayFormat, { locale: localeObj }) + timeFormat
    }
  }
  
  const dateFormat = longFormat ? 'dd \'de\' MMMM \'de\' yyyy' : 'dd/MM/yyyy'
  const timeFormat = includeTime ? ' \'às\' HH:mm' : ''
  
  return format(d, dateFormat + timeFormat, { locale: localeObj })
}

/**
 * Formata tempo relativo (ex: "há 2 horas")
 */
export function formatRelativeTime(
  date: DateInput,
  options: RelativeTimeOptions = {}
): string {
  const d = toDate(date)
  
  if (!isValid(d)) {
    return 'Data inválida'
  }
  
  const { addSuffix = true, includeSeconds = false } = options
  
  return formatDistanceToNow(d, {
    addSuffix,
    locale: ptBR,
    includeSeconds
  })
}

/**
 * Verifica se uma data está em um range
 */
export function isDateInRange(
  date: DateInput,
  start: DateInput,
  end: DateInput
): boolean {
  const d = toDate(date)
  const s = toDate(start)
  const e = toDate(end)
  
  return isValid(d) && isValid(s) && isValid(e) && d >= s && d <= e
}

/**
 * Formata duração em minutos para formato legível
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

/**
 * Obtém horário de trabalho moçambicano
 */
export function getMozambiqueBusinessHours(): { start: string; end: string } {
  return {
    start: '08:00',
    end: '17:00'
  }
}

/**
 * Verifica se é horário comercial em Moçambique
 */
export function isMozambiqueBusinessHours(date: DateInput = new Date()): boolean {
  const d = toDate(date)
  const hour = d.getHours()
  const day = d.getDay()
  
  // Segunda a sexta, 8h às 17h
  return day >= 1 && day <= 5 && hour >= 8 && hour < 17
}
