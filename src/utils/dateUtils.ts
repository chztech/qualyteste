// src/utils/dateUtils.ts

/**
 * Utilitários de data/hora SEM surpresas de timezone:
 * - Sempre tratamos "datas" (YYYY-MM-DD) como meia-noite no fuso LOCAL.
 * - Não usamos Date.toISOString() para montar datas de calendário.
 */

/** Zero-pad */
const zp = (n: number, len = 2) => n.toString().padStart(len, "0");

/** Retorna um clone da data. */
export function clone(date: Date): Date {
  return new Date(date.getTime());
}

/** Normaliza para o início do dia (LOCAL). */
export function startOfDay(date: Date): Date {
  const d = clone(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Normaliza para o fim do dia (LOCAL). */
export function endOfDay(date: Date): Date {
  const d = clone(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Converte um Date para string YYYY-MM-DD (LOCAL, sem UTC shift). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${zp(date.getMonth() + 1)}-${zp(date.getDate())}`;
}

/** Alias usado em alguns componentes (ex.: MonthView). */
export function toYMD(date: Date): string {
  return toISODate(date);
}

/** Cria um Date (LOCAL) a partir de "YYYY-MM-DD" (meia-noite local). */
export function fromISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** YYYY-MM-DD para inputs <input type=date> (igual ao toISODate). */
export function dateToInputString(date: Date): string {
  return toISODate(date);
}

/** Retorna a data atual como YYYY-MM-DD (LOCAL). */
export function getCurrentDateString(): string {
  return toISODate(new Date());
}

/** Soma dias (mantendo fuso local). */
export function addDays(date: Date, days: number): Date {
  const d = clone(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Compara apenas a parte de data (ignora tempo). */
export function areSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Converte "HH:mm" => minutos desde 00:00. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Converte minutos => "HH:mm". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${zp(h)}:${zp(m)}`;
}

/** Junta data "YYYY-MM-DD" + "HH:mm" em um Date local. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const d = fromISODate(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Data no passado? (compara meia-noite local) */
export function isDatePast(dateStr: string): boolean {
  const today = startOfDay(new Date());
  const d = startOfDay(fromISODate(dateStr));
  return d.getTime() < today.getTime();
}

/** Data+hora no passado? (local) */
export function isDateTimePast(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const dt = combineDateAndTime(dateStr, timeStr);
  return dt.getTime() < now.getTime();
}

/** Formata data (Date ou "YYYY-MM-DD") com Intl.DateTimeFormat. */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
  locale = "pt-BR"
): string {
  const d = typeof date === "string" ? fromISODate(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/** Formata "segunda, 14/10/2025" (weekday + dd/mm/aaaa). */
export function formatDateWithWeekday(
  date: Date | string,
  locale = "pt-BR"
): string {
  return formatDate(
    date,
    { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" },
    locale
  );
}

/**
 * Intervalo da semana da data informada.
 * Semana começando na segunda (weekStartsOn=1) por padrão.
 */
export function getWeekRange(
  date: Date,
  weekStartsOn: 0 | 1 = 1
): { start: Date; end: Date } {
  const base = startOfDay(date);
  const day = base.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  const diff = (day - weekStartsOn + 7) % 7;

  const start = addDays(base, -diff);
  const end = endOfDay(addDays(start, 6));
  return { start, end };
}

/**
 * Matriz do mês (6 linhas x 7 colunas) iniciando na segunda por padrão.
 * Retorna um array de semanas; cada semana é um array de Dates.
 */
export function getMonthMatrix(
  year: number,
  monthIndex: number, // 0 = Jan
  weekStartsOn: 0 | 1 = 1
): Date[][] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const { start } = getWeekRange(firstOfMonth, weekStartsOn);

  const weeks: Date[][] = [];
  let cursor = startOfDay(start);

  for (let w = 0; w < 6; w++) {
    const days: Date[] = [];
    for (let d = 0; d < 7; d++) {
      days.push(clone(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
  }

  return weeks;
}

/** Retorna "YYYY-MM" da data. */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${zp(date.getMonth() + 1)}`;
}

/** Retorna label do mês/ano no formato "Outubro 2025". */
export function monthYearLabel(date: Date, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Avança/recua um mês mantendo o dia (com clamp no fim do mês). */
export function addMonths(date: Date, count: number): Date {
  const d = clone(date);
  const targetMonth = d.getMonth() + count;
  const day = d.getDate();

  d.setDate(1);
  d.setMonth(targetMonth + 1, 0); // último dia do mês alvo
  const lastDay = d.getDate();

  d.setMonth(targetMonth, Math.min(day, lastDay));
  return d;
}

/** Retorna se "date" está no mesmo mês/ano de "ref". */
export function isSameMonth(date: Date, ref: Date): boolean {
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

/** Helper: string 'YYYY-MM-DD' amigável (para depuração). */
export function debugISO(date: Date): string {
  return toISODate(date) + ` ${zp(date.getHours())}:${zp(date.getMinutes())}`;
}

/**
 * Constrói um rótulo de turno a partir de HH:mm.
 * morning: 06:00–11:59, afternoon: 12:00–17:59, evening: 18:00–23:59
 */
export function shiftFromTime(
  time: string
): "morning" | "afternoon" | "evening" {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}
