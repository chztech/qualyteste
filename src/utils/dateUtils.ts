// 📅 UTILITÁRIOS DE DATA - GARANTIR CONSISTÊNCIA EM TODO O SISTEMA
// Todas as funções garantem que as datas sejam tratadas de forma consistente

/**
 * Helpers internos para tratar YYYY-MM-DD sem shift de timezone
 */
const parseYMD = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
};

/**
 * Cria um Date travado em UTC (00:00:00 UTC) a partir de YYYY-MM-DD
 * Evita deslocamentos de fuso ao formatar/exibir.
 */
const makeUTCDateFromYMD = (date: string): Date => {
  const { y, m, d } = parseYMD(date);
  // Date.UTC(y, m-1, d) cria um timestamp em UTC; new Date(timestamp) guarda isso
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

/**
 * Descobre se a origem é YYYY-MM-DD (apenas data).
 */
const isYMD = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

/**
 * Formatar data para exibição em português brasileiro
 * - Para strings YYYY-MM-DD, formata em UTC (sem shift)
 * - Para Date, usa a instância como veio (sem impor timezone)
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    let dateObj: Date;

    if (isYMD(date)) {
      dateObj = makeUTCDateFromYMD(date);
    } else if (date instanceof Date) {
      dateObj = new Date(date);
    } else {
      throw new Error("Tipo de data inválido");
    }

    // Para strings (YYYY-MM-DD), travamos em UTC. Para Date, não forçamos timezone.
    const defaultOptions: Intl.DateTimeFormatOptions = isYMD(date)
      ? {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
          ...options,
        }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...options,
        };

    return dateObj.toLocaleDateString("pt-BR", defaultOptions);
  } catch (error) {
    console.error("Erro ao formatar data:", error, date);
    return "Erro na data";
  }
};

/**
 * Formatar data com dia da semana
 */
export const formatDateWithWeekday = (date: string | Date): string => {
  return formatDate(date, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formatar data de forma compacta (DD/MM)
 */
export const formatDateCompact = (date: string | Date): string => {
  return formatDate(date, {
    day: "2-digit",
    month: "2-digit",
  });
};

/**
 * Converter Date para string no formato YYYY-MM-DD (para inputs)
 * Mantido comportamento local (como já era), pois é usado para "hoje" no navegador.
 */
export const dateToInputString = (date: Date): string => {
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Erro ao converter data para string:", error, date);
    return new Date().toISOString().split("T")[0];
  }
};

/**
 * Obter data atual no formato YYYY-MM-DD (local)
 */
export const getCurrentDateString = (): string => {
  return dateToInputString(new Date());
};

/**
 * Verificar se uma data (YYYY-MM-DD) já passou (comparação em UTC, dia a dia)
 */
export const isDatePast = (date: string): boolean => {
  try {
    const target = makeUTCDateFromYMD(date);
    const today = new Date();
    // Normaliza "hoje" para UTC 00:00 com base em hoje local
    const todayUTC = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
    return target.getTime() < todayUTC.getTime();
  } catch (error) {
    console.error("Erro ao verificar se data passou:", error, date);
    return false;
  }
};

/**
 * Verificar se uma data e horário já passaram (data é YYYY-MM-DD; comparação usando now local)
 */
export const isDateTimePast = (date: string, time: string): boolean => {
  try {
    const { y, m, d } = parseYMD(date);
    const [hours, minutes] = time.split(":").map(Number);
    // Monta Date em UTC para a data e horário
    const target = new Date(Date.UTC(y, m - 1, d, hours, minutes, 0, 0));
    const now = new Date();
    return target.getTime() < now.getTime();
  } catch (error) {
    console.error("Erro ao verificar se data/hora passou:", error, date, time);
    return false;
  }
};

/**
 * Verificar se uma data (YYYY-MM-DD) é hoje (comparação em UTC "dia a dia")
 */
export const isToday = (date: string): boolean => {
  try {
    const target = makeUTCDateFromYMD(date);
    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    return (
      target.getUTCFullYear() === todayUTC.getUTCFullYear() &&
      target.getUTCMonth() === todayUTC.getUTCMonth() &&
      target.getUTCDate() === todayUTC.getUTCDate()
    );
  } catch (error) {
    console.error("Erro ao verificar se é hoje:", error, date);
    return false;
  }
};

/**
 * Obter início e fim da semana (YYYY-MM-DD ou Date) — cálculo em UTC
 * Domingo como início (getUTCDay)
 */
export const getWeekRange = (
  date: string | Date
): { start: string; end: string } => {
  try {
    let base: Date;
    if (isYMD(date)) base = makeUTCDateFromYMD(date);
    else base = new Date(date);

    const start = new Date(base);
    // zera para 00:00:00 UTC
    start.setUTCHours(0, 0, 0, 0);
    const day = start.getUTCDay(); // 0 = domingo
    start.setUTCDate(start.getUTCDate() - day);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    return {
      start: `${start.getUTCFullYear()}-${String(
        start.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`,
      end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(end.getUTCDate()).padStart(2, "0")}`,
    };
  } catch (error) {
    console.error("Erro ao obter range da semana:", error, date);
    const today = getCurrentDateString();
    return { start: today, end: today };
  }
};

/**
 * Obter início e fim do mês (YYYY-MM-DD ou Date) — cálculo em UTC
 */
export const getMonthRange = (
  date: string | Date
): { start: string; end: string } => {
  try {
    let base: Date;
    if (isYMD(date)) base = makeUTCDateFromYMD(date);
    else base = new Date(date);

    const start = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1)
    );
    const end = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
    );

    return {
      start: `${start.getUTCFullYear()}-${String(
        start.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`,
      end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(end.getUTCDate()).padStart(2, "0")}`,
    };
  } catch (error) {
    console.error("Erro ao obter range do mês:", error, date);
    const today = getCurrentDateString();
    return { start: today, end: today };
  }
};

/**
 * Comparar duas datas (YYYY-MM-DD) — comparação em UTC
 */
export const compareDates = (date1: string, date2: string): number => {
  try {
    const d1 = makeUTCDateFromYMD(date1).getTime();
    const d2 = makeUTCDateFromYMD(date2).getTime();
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  } catch (error) {
    console.error("Erro ao comparar datas:", error, date1, date2);
    return 0;
  }
};

/**
 * Adicionar dias a uma data (YYYY-MM-DD) — operação em UTC
 */
export const addDays = (date: string, days: number): string => {
  try {
    const d = makeUTCDateFromYMD(date);
    d.setUTCDate(d.getUTCDate() + days);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;
  } catch (error) {
    console.error("Erro ao adicionar dias:", error, date, days);
    return date;
  }
};

/**
 * Obter lista de datas entre duas datas (YYYY-MM-DD) — sequência em UTC
 */
export const getDateRange = (startDate: string, endDate: string): string[] => {
  try {
    const dates: string[] = [];
    let cur = startDate;
    while (compareDates(cur, endDate) <= 0) {
      dates.push(cur);
      cur = addDays(cur, 1);
    }
    return dates;
  } catch (error) {
    console.error("Erro ao obter range de datas:", error, startDate, endDate);
    return [startDate];
  }
};

/**
 * Converter horário (HH:MM) para minutos
 */
export const timeToMinutes = (time: string): number => {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  } catch (error) {
    console.error("Erro ao converter horário para minutos:", error, time);
    return 0;
  }
};

/**
 * Converter minutos para horário (HH:MM)
 */
export const minutesToTime = (minutes: number): string => {
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  } catch (error) {
    console.error("Erro ao converter minutos para horário:", error, minutes);
    return "00:00";
  }
};
