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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// =============================================================================
// CORE UTILITIES
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}