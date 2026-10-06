import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import { LIST_WEEKS, TasterListEntry, tasterListFor } from "@/src/lib/tasters";

export type TasterBookingsResponse = {
  venue: string;
  choir: string;
  // UK date of today's rehearsal, "YYYY-MM-DD"
  today: string;
  weeks: number;
  bookings: TasterListEntry[];
};

// The app's GA "Taster bookings" screen: who's booked a free taster at this
// choir and not come yet, and who's been checked in as a taster here (today
// or earlier) - all from the last LIST_WEEKS.
// GA only. GET ?venue=dorking
export default async function tasterBookings(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { venue } = req.query;
  if (typeof venue !== "string" || !venue) {
    return res.status(400).json({ message: "Venue is required" });
  }
  if (!(await requireGA(req, res))) return undefined;

  const list = await tasterListFor(venue);
  if (!list) return res.status(404).json({ message: "Venue not found" });
  return res.status(200).json({
    venue,
    choir: list.choir,
    today: list.today,
    weeks: LIST_WEEKS,
    bookings: list.bookings,
  } as TasterBookingsResponse);
}
