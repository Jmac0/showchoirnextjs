import mongoose from "mongoose";

// A break when there are no rehearsals (usually about 5 a year), set on the
// admin "Holidays" page. While one is on, the Book a taster form says so
// (lib/holidays.ts). Dates are UK dates as "YYYY-MM-DD" strings, so there's
// no timezone to get wrong.
export type HolidayType = {
  // The first day with no rehearsals
  start: string;
  // The day rehearsals start again - the banner says "until" this day
  back_on: string;
  // Optional, for admins only, e.g. "Christmas"
  note?: string;
  created_at: Date;
};

const HolidaySchema = new mongoose.Schema<HolidayType>({
  start: { type: String, required: true },
  back_on: { type: String, required: true },
  note: String,
  created_at: { type: Date, default: Date.now },
});
// Finding the holiday that's on today
HolidaySchema.index({ start: 1, back_on: 1 });

export default (mongoose.models.Holidays as mongoose.Model<HolidayType>) ||
  mongoose.model<HolidayType>("Holidays", HolidaySchema);
