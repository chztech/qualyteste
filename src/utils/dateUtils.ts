// Todas as funcoes abaixo evitam new Date('YYYY-MM-DD') para manter consistencia local.

type DateInput = string | Date;

const BASE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
};

export const toYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalDate = (value: DateInput): Date | null => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "string") {
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if ([year, month, day].some(Number.isNaN)) return null;
    return new Date(year, month - 1, day);
  }

  return null;
};

const toYMDString = (value: DateInput): string | null => {
  if (value instanceof Date) {
    return toYMD(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
};

export const addDaysYMD = (ymd: string, add = 0) => {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + add);
  return toYMD(date);
};

export const addDays = (ymd: string, add = 0) => addDaysYMD(ymd, add);

export const sameYMD = (a: string, b: string) => a === b;

export const isDatePast = (ymd: string) => {
  const today = getCurrentDateString();
  return ymd < today;
};

export const isDateTimePast = (ymd: string, hhmm: string) => {
  const now = new Date();
  const currentYMD = getCurrentDateString();
  const currentHM =
    `${now.getHours()}`.padStart(2, "0") +
    ":" +
    `${now.getMinutes()}`.padStart(2, "0");

  if (ymd < currentYMD) return true;
  if (ymd > currentYMD) return false;
  return hhmm <= currentHM;
};

export const formatDate = (
  value: DateInput,
  opts?: Intl.DateTimeFormatOptions
) => {
  const date = toLocalDate(value);
  if (!date) {
    return typeof value === "string" ? value : "";
  }

  const formatOptions = opts
    ? { ...BASE_DATE_OPTIONS, ...opts }
    : BASE_DATE_OPTIONS;
  return date.toLocaleDateString("pt-BR", formatOptions);
};

export const formatDateWithWeekday = (value: DateInput) =>
  formatDate(value, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatDateCompact = (value: DateInput) =>
  formatDate(value, {
    day: "2-digit",
    month: "2-digit",
  });

export const dateToInputString = (date: Date) => toYMD(date);

export const getCurrentDateString = () => toYMD(new Date());

export const isToday = (value: DateInput) => {
  const ymd = toYMDString(value);
  if (!ymd) return false;
  return sameYMD(ymd, getCurrentDateString());
};

export const getWeekRange = (
  value: DateInput,
  weekStartsOn = 0
): { start: string; end: string } => {
  const date = toLocalDate(value);
  if (!date) {
    const today = getCurrentDateString();
    return { start: today, end: today };
  }

  const start = new Date(date);
  const diff = (start.getDay() - weekStartsOn + 7) % 7;
  start.setDate(start.getDate() - diff);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toYMD(start),
    end: toYMD(end),
  };
};

export const getMonthRange = (
  value: DateInput
): { start: string; end: string } => {
  const date = toLocalDate(value);
  if (!date) {
    const today = getCurrentDateString();
    return { start: today, end: today };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: toYMD(start),
    end: toYMD(end),
  };
};

// Para os headers do calendario:
export const startOfWeekYMD = (anyYmd: string, weekStartsOn = 0) => {
  const [year, month, day] = anyYmd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return toYMD(date);
};

export const addMinutes = (hhmm: string, minutes: number) => {
  const [hours, mins] = hhmm.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, mins);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
};
