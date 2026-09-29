// Rehearsals are in the UK, so "today" is always the UK date, whatever
// timezone the server runs in.

// "2026-09-29" (en-CA formats dates as YYYY-MM-DD)
export const ukDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

// "Tuesday"
export const ukWeekday = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
  }).format(date);

// Minutes since midnight, UK time (e.g. 19:30 -> 1170)
export const ukMinutesNow = (date = new Date()) => {
  const [hours, minutes] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
};

// True for a "YYYY-MM-DD" string
export const isDateString = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
