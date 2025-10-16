// ✅ TODAS as funções abaixo evitam new Date('YYYY-MM-DD') (UTC trap)

export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export const addDaysYMD = (ymd: string, add = 0) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + add);
  return toYMD(dt);
};

export const sameYMD = (a: string, b: string) => a === b;

export const isDatePast = (ymd: string) => {
  const today = toYMD(new Date());
  return ymd < today;
};

export const isDateTimePast = (ymd: string, hhmm: string) => {
  // compara strings com now local
  const now = new Date();
  const localYMD = toYMD(now);
  const localHM =
    `${now.getHours()}`.padStart(2, "0") +
    ":" +
    `${now.getMinutes()}`.padStart(2, "0");

  if (ymd < localYMD) return true;
  if (ymd > localYMD) return false;
  return hhmm <= localHM;
};

export const formatDate = (ymd: string, opts?: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    "pt-BR",
    opts ?? {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

export const formatDateWithWeekday = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getCurrentDateString = () => toYMD(new Date());

// Para os headers do calendário:
export const startOfWeekYMD = (anyYmd: string, weekStartsOn = 0) => {
  const [y, m, d] = anyYmd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  dt.setDate(dt.getDate() - diff);
  return toYMD(dt);
};

export const addMinutes = (hhmm: string, minutes: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
};
