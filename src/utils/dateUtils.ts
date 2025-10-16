// src/utils/dateUtils.ts

/** Zero-pad */
const zp = (n: number, len = 2) => n.toString().padStart(len, "0");

/** Clona a data. */
export function clone(date: Date): Date {
  return new Date(date.getTime());
}

/** Início do dia (LOCAL). */
export function startOfDay(date: Date): Date {
  const d = clone(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fim do dia (LOCAL). */
export function endOfDay(date: Date): Date {
  const d = clone(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Date -> "YYYY-MM-DD" (LOCAL, sem shift de UTC). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${zp(date.getMonth() + 1)}-${zp(
    date.getDate()
  )}`;
}

/** Alias usado por alguns componentes. */
export function toYMD(date: Date): string {
  return toISODate(date);
}

/** "YYYY-MM-DD" -> Date (meia-noite LOCAL). */
export function fromISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** Para <input type="date">. */
export function dateToInputString(date: Date): string {
  return toISODate(date);
}

/** Hoje em "YYYY-MM-DD". */
export function getCurrentDateString(): string {
  return toISODate(new Date());
}

/** Soma dias (LOCAL). */
export function addDays(date: Date, days: number): Date {
  const d = clone(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Soma dias em uma string "YYYY-MM-DD" e retorna no mesmo formato. */
export function addDaysYMD(ymd: string, days: number): string {
  return toISODate(addDays(fromISODate(ymd), days));
}

/** Compara só a parte da data. */
export function areSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "HH:mm" -> minutos. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutos -> "HH:mm". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${zp(h)}:${zp(m)}`;
}

/** Junta "YYYY-MM-DD" + "HH:mm" num Date LOCAL. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const d = fromISODate(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Data no passado? (compara meia-noite LOCAL) */
export function isDatePast(dateStr: string): boolean {
  const today = startOfDay(new Date());
  const d = startOfDay(fromISODate(dateStr));
  return d.getTime() < today.getTime();
}

/** Data+hora no passado? (LOCAL) */
export function isDateTimePast(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const dt = combineDateAndTime(dateStr, timeStr);
  return dt.getTime() < now.getTime();
}

/** Formata data (Date ou "YYYY-MM-DD") via Intl. */
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

/** "segunda-feira, 14/10/2025". */
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

/** Início da semana (Date). */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  return getWeekRange(date, weekStartsOn).start;
}

/** Fim da semana (Date). */
export function endOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  return getWeekRange(date, weekStartsOn).end;
}

/** Início da semana em "YYYY-MM-DD". */
export function startOfWeekYMD(
  date: Date,
  weekStartsOn: 0 | 1 = 1
): string {
  return toISODate(startOfWeek(date, weekStartsOn));
}

/** Fim da semana em "YYYY-MM-DD". */
export function endOfWeekYMD(date: Date, weekStartsOn: 0 | 1 = 1): string {
  return toISODate(endOfWeek(date, weekStartsOn));
}

/** Início do mês (Date). */
export function startOfMonth(date: Date): Date {
  const d = clone(date);
  d.setDate(1);
  return startOfDay(d);
}

/** Fim do mês (Date). */
export function endOfMonth(date: Date): Date {
  const d = clone(date);
  d.setMonth(d.getMonth() + 1, 0); // último dia do mês atual
  return endOfDay(d);
}

/** Intervalo do mês da data informada. */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

/** Início do mês em "YYYY-MM-DD". */
export function startOfMonthYMD(date: Date): string {
  return toISODate(startOfMonth(date));
}

/** Fim do mês em "YYYY-MM-DD". */
export function endOfMonthYMD(date: Date): string {
  return toISODate(endOfMonth(date));
}

/**
 * Matriz do mês (6 x 7) começando na segunda por padrão.
 * Cada linha = semana; cada item = Date do dia.
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

/** "YYYY-MM" da data. */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${zp(date.getMonth() + 1)}`;
}

/** "Outubro 2025". */
export function monthYearLabel(date: Date, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Soma meses, clampando no fim do mês se necessário. */
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

/** Mesmo mês/ano que ref? */
export function isSameMonth(date: Date, ref: Date): boolean {
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth()
  );
}

/** Útil para debug. */
export function debugISO(date: Date): string {
  return (
    toISODate(date) + ` ${zp(date.getHours())}:${zp(date.getMinutes())}`
  );
}

/** Turno a partir de "HH:mm". */
export function shiftFromTime(
  time: string
): "morning" | "afternoon" | "evening" {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}
