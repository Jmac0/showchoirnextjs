// Holiday types and helpers that are safe for the browser (no database) -
// the server side is lib/holidays.ts.

export type HolidayRow = {
  id: string;
  start: string;
  back_on: string;
  note: string;
};

// The holiday on today, as the Book a taster form gets it
export type CurrentHoliday = { back_on: string } | null;

// Longest note an admin can save
export const MAX_HOLIDAY_NOTE = 100;

const ordinal = (day: number) => {
  if (day >= 11 && day <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
};

// "2026-10-26" -> "Monday 26th October". The date is read as midday UTC so
// it's the same day whatever timezone the browser is in.
export const formatHolidayDate = (date: string) => {
  const when = new Date(`${date}T12:00:00Z`);
  const weekday = when.toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = when.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const day = when.getUTCDate();
  return `${weekday} ${day}${ordinal(day)} ${month}`;
};

// What the banner says
export const holidayMessage = (backOn: string) =>
  `We are on holiday until ${formatHolidayDate(backOn)}`;
