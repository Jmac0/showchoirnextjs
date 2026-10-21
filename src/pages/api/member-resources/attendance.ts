import { NextApiRequest, NextApiResponse } from "next";

import { AttendanceEntry, listAttendance } from "@/src/lib/attendance";
import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import { isDateString, ukDate } from "@/src/lib/ukDate";

// (moved to lib/attendance.ts - still exported from here for the app)
export type { AttendanceEntry };

export type AttendanceResponse = {
  venue: string;
  session_date: string;
  count: number;
  checkins: AttendanceEntry[];
  // Whether the GA asking is checked in at this rehearsal themselves - the
  // app hides its "Check myself in" button once they are
  me_checked_in: boolean;
};

// Everyone scanned in at one rehearsal, for the app's GA "Who's here" list.
//   GET ?venue=banstead            today's rehearsal
//   GET ?venue=banstead&date=2026-09-29
export default async function attendance(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { venue, date } = req.query;
  if (typeof venue !== "string" || !venue) {
    return res.status(400).json({ message: "Venue is required" });
  }
  if (date !== undefined && !isDateString(date)) {
    return res.status(400).json({ message: "Date must be YYYY-MM-DD" });
  }
  const sessionDate = date ?? ukDate();

  const ga = await requireGA(req, res);
  if (!ga) return undefined;

  const { entries, memberIds } = await listAttendance(venue, sessionDate);

  const response: AttendanceResponse = {
    venue,
    session_date: sessionDate,
    count: entries.length,
    checkins: entries,
    me_checked_in: memberIds.includes(String(ga.id)),
  };

  return res.status(200).json(response);
}
