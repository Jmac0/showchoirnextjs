import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import Checkins from "@/src/lib/models/checkin";
import { isDateString, ukDate } from "@/src/lib/ukDate";

export type AttendanceEntry = {
  id: string;
  first_name: string;
  last_name: string;
  membership_type?: string;
  scanned_at: string;
};

export type AttendanceResponse = {
  venue: string;
  session_date: string;
  count: number;
  checkins: AttendanceEntry[];
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
    return res;
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

  if (!(await requireGA(req, res))) return res;

  const checkins = await Checkins.find({ venue, session_date: sessionDate })
    // case-insensitive A-Z by name, for roll call
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: 1, last_name: 1 })
    .lean();

  const response: AttendanceResponse = {
    venue,
    session_date: sessionDate,
    count: checkins.length,
    checkins: checkins.map((checkin) => ({
      id: String(checkin._id),
      first_name: checkin.first_name,
      last_name: checkin.last_name,
      membership_type: checkin.membership_type,
      scanned_at: checkin.scanned_at.toISOString(),
    })),
  };

  return res.status(200).json(response);
}
