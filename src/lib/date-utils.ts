import { format } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Safely format a date string or Date object.
 * Returns a fallback string if the date is invalid, null, or undefined.
 */
export function safeFormat(
  date: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy',
  fallback: string = '-'
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return format(dateObj, formatStr, { locale: th });
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
}
