import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { VENUE_SLUG } from "@/src/lib/checkins";
import { applyCors } from "@/src/lib/cors";
import TasterBookings from "@/src/lib/models/tasterBooking";
import { ukDate } from "@/src/lib/ukDate";

// Checks someone in as a taster attendee at today's rehearsal - from the
// app's "Taster bookings" screen (tap) - or undoes it (long-press there or on
// "Who's here", where checked-in tasters are listed too). GA only.
//   POST { booking_id, venue }          check in
//   POST { booking_id, undo: true }     undo (today's check-ins only)
export default async function tasterCheckIn(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return res;
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const {
    booking_id: bookingId,
    venue,
    undo,
  } = req.body as {
    booking_id?: string;
    venue?: string;
    undo?: boolean;
  };
  if (!isValidObjectId(bookingId)) {
    return res.status(400).json({ message: "Booking is required" });
  }
  const ga = await requireGA(req, res);
  if (!ga) return res;

  if (undo === true) {
    // Back to "booked" - only for today's check-ins
    const result = await TasterBookings.updateOne(
      { _id: bookingId, attended_date: ukDate() },
      {
        $unset: {
          attended_at: 1,
          attended_date: 1,
          attended_venue: 1,
          checked_in_by: 1,
        },
      }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ message: "Check-in not found" });
    }
    return res.status(200).json({ message: "Check-in undone" });
  }

  if (typeof venue !== "string" || !VENUE_SLUG.test(venue)) {
    return res.status(400).json({ message: "Venue is required" });
  }
  // Only if they haven't come yet (so two GAs tapping at once is harmless)
  const booking = await TasterBookings.findOneAndUpdate(
    { _id: bookingId, attended_at: null },
    {
      attended_at: new Date(),
      attended_date: ukDate(),
      attended_venue: venue,
      checked_in_by: ga._id,
    },
    { new: true }
  );
  if (!booking) {
    return res
      .status(409)
      .json({ message: "Already checked in, or booking not found" });
  }
  return res.status(200).json({
    message: `${booking.first_name} ${booking.last_name} checked in as a taster`,
  });
}
