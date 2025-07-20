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
// DATE UTILITIES
// =============================================================================

/**
 * Formata uma data em string legível
 */
export const formatDate = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Data inválida'
    return format(dateObj, pattern, { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

/**
 * Formata data relativa (ex: "há 2 horas")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Data inválida'

    // For SSR compatibility, avoid real-time calculations during hydration
    if (typeof window === 'undefined') {
      return formatDate(dateObj, 'dd/MM/yyyy')
    }

    if (isToday(dateObj)) {
      const hours = differenceInHours(new Date(), dateObj)
      const minutes = differenceInMinutes(new Date(), dateObj)

      if (hours < 1) {
        return `há ${minutes} minuto${minutes !== 1 ? 's' : ''}`
      }
      return `há ${hours} hora${hours !== 1 ? 's' : ''}`
    }

    if (isYesterday(dateObj)) {
      return 'ontem'
    }

    const days = differenceInDays(new Date(), dateObj)
    if (days < 7) {
      return `há ${days} dia${days !== 1 ? 's' : ''}`
    }

    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error)
    return 'Data inválida'
  }
}

/**
 * Verifica se uma data é hoje
 */
export const isDateToday = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && isToday(dateObj)
  } catch {
    return false
  }
}

/**
 * Verifica se uma data é ontem
 */
export const isDateYesterday = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && isYesterday(dateObj)
  } catch {
    return false
  }
}

/**
 * Obtém início do dia
 */
export const getStartOfDay = (date: string | Date = new Date()): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return startOfDay(dateObj)
}

/**
 * Obtém fim do dia
 */
export const getEndOfDay = (date: string | Date = new Date()): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return endOfDay(dateObj)
}