import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import TasterBookings from "@/src/lib/models/tasterBooking";
import { isDateString, ukDate } from "@/src/lib/ukDate";

export type AttendanceEntry = {
  id: string;
  first_name: string;
  last_name: string;
  membership_type?: string;
  scanned_at: string;
  // "cash" / "card" / "pay_later" if they weren't paid up when scanned
  payment?: string;
  // Pounds taken at the desk with a cash/card payment
  amount?: number;
  // A GA (they come free) - the app shows a gold star instead of their
  // membership type
  is_ga: boolean;
  // Someone on a free taster (checked in from "Taster bookings"), not a
  // member - id is their booking's, and undo goes to taster-check-in
  is_taster?: boolean;
};

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

  const checkins = await Checkins.find({ venue, session_date: sessionDate })
    // case-insensitive A-Z by name, for roll call
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: 1, last_name: 1 })
    .lean();

  // Which of them are GAs (shown with a gold star in the app). Looked up from
  // the members, so it's right even for check-ins made before they became a GA.
  const gaIds = new Set(
    (
      await Members.find({
        _id: { $in: checkins.map((checkin) => checkin.member_id) },
        role: "ga",
      }).distinct("_id")
    ).map(String)
  );

  // Tasters checked in at this rehearsal (from "Taster bookings")
  const tasters = await TasterBookings.find({
    attended_venue: venue,
    attended_date: sessionDate,
  }).lean();

  const memberEntries: AttendanceEntry[] = checkins.map((checkin) => ({
    id: String(checkin._id),
    first_name: checkin.first_name,
    last_name: checkin.last_name,
    membership_type: checkin.membership_type,
    scanned_at: checkin.scanned_at.toISOString(),
    payment: checkin.payment,
    amount: checkin.amount,
    is_ga: gaIds.has(String(checkin.member_id)),
  }));
  const tasterEntries: AttendanceEntry[] = tasters.map((taster) => ({
    id: String(taster._id),
    first_name: taster.first_name,
    last_name: taster.last_name,
    scanned_at: (taster.attended_at as Date).toISOString(),
    is_ga: false,
    is_taster: true,
  }));
  // Everyone, A-Z by name, for roll call
  const everyone = [...memberEntries, ...tasterEntries].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(
      `${b.first_name} ${b.last_name}`,
      "en",
      { sensitivity: "base" }
    )
  );

  const response: AttendanceResponse = {
    venue,
    session_date: sessionDate,
    count: everyone.length,
    checkins: everyone,
    me_checked_in: checkins.some(
      (checkin) => String(checkin.member_id) === String(ga.id)
    ),
  };

  return res.status(200).json(response);
}
