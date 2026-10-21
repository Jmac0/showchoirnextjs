import { NextApiRequest, NextApiResponse } from "next";

import { listAttendance } from "@/src/lib/attendance";
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { summariseAttendance } from "@/src/lib/reports";
import { AttendanceReport } from "@/src/lib/reportsShared";
import { isDateString } from "@/src/lib/ukDate";

// Attendance report (admins only) - the same list as the app's GA "Who's
// here", for any rehearsal.
//   GET ?venue=choir-dorking-surrey&date=2026-09-29
export default async function attendanceReport(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { venue, date } = req.query;
  if (typeof venue !== "string" || !venue) {
    return res.status(400).json({ message: "Please choose a choir" });
  }
  if (!isDateString(date)) {
    return res.status(400).json({ message: "Please choose a date" });
  }

  const { entries } = await listAttendance(venue, date);
  const report: AttendanceReport = {
    venue,
    session_date: date,
    summary: summariseAttendance(entries),
    entries,
  };
  return res.status(200).json(report);
}
