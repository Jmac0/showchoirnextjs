import dbConnect from "@/src/lib/dbConnect";
import { CurrentHoliday, HolidayRow } from "@/src/lib/holidaysShared";
import Holidays from "@/src/lib/models/holiday";
import { isDateString, ukDate } from "@/src/lib/ukDate";

// Holidays (no rehearsals) - set on the admin "Holidays" page, shown on the
// Book a taster form while one is on. Browser-safe bits: holidaysShared.ts.

// Every holiday, soonest first
export async function listHolidays(): Promise<HolidayRow[]> {
  await dbConnect();
  const holidays = await Holidays.find().sort({ start: 1 }).lean();
  return holidays.map((h) => ({
    id: String(h._id),
    start: h.start,
    back_on: h.back_on,
    note: h.note || "",
  }));
}

// The holiday on today (UK date): from its first day off up to, but not
// including, the day rehearsals start again. If two overlap, the one that
// ends later wins, so the banner gives the real return date.
export async function currentHoliday(
  today = ukDate()
): Promise<CurrentHoliday> {
  await dbConnect();
  const holiday = await Holidays.findOne({
    start: { $lte: today },
    back_on: { $gt: today },
  })
    .sort({ back_on: -1 })
    .lean();
  return holiday ? { back_on: holiday.back_on } : null;
}

// True for a real calendar date as "YYYY-MM-DD" (not e.g. 2026-02-30)
export const isRealDate = (value: unknown): value is string => {
  if (!isDateString(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  // An impossible date is either invalid or rolls into the next month
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};
