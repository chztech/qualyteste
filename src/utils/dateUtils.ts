// 📅 UTILITÁRIOS DE DATA - GARANTIR CONSISTÊNCIA EM TODO O SISTEMA
// Todas as funções garantem que as datas sejam tratadas de forma consistente

/**
 * Formatar data para exibição em português brasileiro
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @param options - Opções de formatação
 * @returns String formatada
 */
export const formatDate = (
  date: string | Date, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Para strings no formato YYYY-MM-DD, criar data local sem conversão de timezone
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return 'Data inválida';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
      ...options
    };
    
    return dateObj.toLocaleDateString('pt-BR', defaultOptions);
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return 'Erro na data';
  }
};

/**
 * Formatar data com dia da semana
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @returns String formatada com dia da semana
 */
export const formatDateWithWeekday = (date: string | Date): string => {
  return formatDate(date, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatar data de forma compacta
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @returns String formatada compacta (DD/MM)
 */
export const formatDateCompact = (date: string | Date): string => {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit'
  });
};

/**
 * Converter Date para string no formato YYYY-MM-DD (para inputs)
 * @param date - Objeto Date
 * @returns String no formato YYYY-MM-DD
 */
export const dateToInputString = (date: Date): string => {
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao converter data para string:', error, date);
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Obter data atual no formato YYYY-MM-DD
 * @returns String da data atual
 */
export const getCurrentDateString = (): string => {
  return dateToInputString(new Date());
};

/**
 * Verificar se uma data já passou (considerando apenas o dia, não o horário)
 * @param date - Data como string (YYYY-MM-DD)
 * @returns Boolean indicando se a data já passou
 */
export const isDatePast = (date: string): boolean => {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Zerar horários para comparar apenas as datas
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return targetDate < today;
  } catch (error) {
    console.error('Erro ao verificar se data passou:', error, date);
    return false;
  }
};

/**
 * Verificar se uma data e horário já passaram
 * @param date - Data como string (YYYY-MM-DD)
 * @param time - Horário como string (HH:MM)
 * @returns Boolean indicando se a data/hora já passou
 */
export const isDateTimePast = (date: string, time: string): boolean => {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const targetDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    
    return targetDateTime < now;
  } catch (error) {
    console.error('Erro ao verificar se data/hora passou:', error, date, time);
    return false;
  }
};

/**
 * Verificar se uma data é hoje
 * @param date - Data como string (YYYY-MM-DD)
 * @returns Boolean indicando se é hoje
 */
export const isToday = (date: string): boolean => {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getDate() === today.getDate()
    );
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error, date);
    return false;
  }
};

/**
 * Obter início e fim da semana para uma data
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @returns Objeto com início e fim da semana
 */
export const getWeekRange = (date: string | Date): { start: string; end: string } => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
    
    const startOfWeek = new Date(dateObj);
    startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: dateToInputString(startOfWeek),
      end: dateToInputString(endOfWeek)
    };
  } catch (error) {
    console.error('Erro ao obter range da semana:', error, date);
    const today = getCurrentDateString();
    return { start: today, end: today };
  }
};

/**
 * Obter início e fim do mês para uma data
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @returns Objeto com início e fim do mês
 */
export const getMonthRange = (date: string | Date): { start: string; end: string } => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
    
    const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    
    return {
      start: dateToInputString(startOfMonth),
      end: dateToInputString(endOfMonth)
    };
  } catch (error) {
    console.error('Erro ao obter range do mês:', error, date);
    const today = getCurrentDateString();
    return { start: today, end: today };
  }
};

/**
 * Comparar duas datas (apenas o dia, ignorando horário)
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns -1 se date1 < date2, 0 se iguais, 1 se date1 > date2
 */
export const compareDates = (date1: string, date2: string): number => {
  try {
    const [year1, month1, day1] = date1.split('-').map(Number);
    const [year2, month2, day2] = date2.split('-').map(Number);
    
    const d1 = new Date(year1, month1 - 1, day1);
    const d2 = new Date(year2, month2 - 1, day2);
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  } catch (error) {
    console.error('Erro ao comparar datas:', error, date1, date2);
    return 0;
  }
};

/**
 * Adicionar dias a uma data
 * @param date - Data base como string (YYYY-MM-DD)
 * @param days - Número de dias para adicionar (pode ser negativo)
 * @returns Nova data como string (YYYY-MM-DD)
 */
export const addDays = (date: string, days: number): string => {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);
    
    return dateToInputString(dateObj);
  } catch (error) {
    console.error('Erro ao adicionar dias:', error, date, days);
    return date;
  }
};

/**
 * Validar formato de data YYYY-MM-DD
 * @param date - String da data
 * @returns Boolean indicando se o formato é válido
 */
export const isValidDateString = (date: string): boolean => {
  try {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  } catch (error) {
    return false;
  }
};

/**
 * Obter lista de datas entre duas datas
 * @param startDate - Data inicial (YYYY-MM-DD)
 * @param endDate - Data final (YYYY-MM-DD)
 * @returns Array de strings de datas
 */
export const getDateRange = (startDate: string, endDate: string): string[] => {
  try {
    const dates: string[] = [];
    let currentDate = startDate;
    
    while (compareDates(currentDate, endDate) <= 0) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  } catch (error) {
    console.error('Erro ao obter range de datas:', error, startDate, endDate);
    return [startDate];
  }
};

/**
 * Converter horário (HH:MM) para minutos
 * @param time - Horário no formato HH:MM
 * @returns Número de minutos desde 00:00
 */
export const timeToMinutes = (time: string): number => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  } catch (error) {
    console.error('Erro ao converter horário para minutos:', error, time);
    return 0;
  }
};

/**
 * Converter minutos para horário (HH:MM)
 * @param minutes - Número de minutos desde 00:00
 * @returns Horário no formato HH:MM
 */
export const minutesToTime = (minutes: number): string => {
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao converter minutos para horário:', error, minutes);
    return '00:00';
  }
};