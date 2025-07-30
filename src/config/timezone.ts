import { toZonedTime, format } from 'date-fns-tz';

// Configuração central de timezone da aplicação
export const TIMEZONE = process.env.TZ || process.env.TIMEZONE || 'America/Rio_Branco';

// Utilitários para manipulação de timezone
export const timezoneUtils = {
  // Converter UTC para timezone local
  toLocalTime: (date: Date): Date => {
    return toZonedTime(date, TIMEZONE);
  },

  // Obter data/hora atual no timezone local
  now: (): Date => {
    return toZonedTime(new Date(), TIMEZONE);
  },

  // Formatar data no timezone local
  formatDate: (date: Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
    const localDate = toZonedTime(date, TIMEZONE);
    return format(localDate, formatStr);
  },

  // Formatar data simples (dd/MM/yyyy)
  formatDateSimple: (date: Date): string => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  },

  // Formatar hora simples (HH:mm)
  formatTimeSimple: (date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // Obter informações do timezone atual
  getTimezoneInfo: () => {
    const now = new Date();
    const utcNow = now.getTime();
    const localNow = toZonedTime(now, TIMEZONE).getTime();
    const offsetHours = (utcNow - localNow) / (1000 * 60 * 60);
    
    return {
      timezone: TIMEZONE,
      offsetHours,
      currentTime: format(toZonedTime(now, TIMEZONE), 'yyyy-MM-dd HH:mm:ss'),
      description: `UTC${offsetHours >= 0 ? '-' : '+'}${Math.abs(offsetHours)}`
    };
  }
};

// Log da configuração de timezone no startup
console.log(`🌍 Application timezone configured: ${TIMEZONE}`);
console.log(`🕐 Current local time: ${timezoneUtils.formatDate(new Date())}`);