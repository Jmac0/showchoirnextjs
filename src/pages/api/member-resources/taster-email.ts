import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import { sendTasterFollowUpEmail } from "@/src/lib/email/sendTasterFollowUpEmail";
import TasterBookings from "@/src/lib/models/tasterBooking";

// Sends someone who booked a taster the "great to meet you - here's how to
// join" email - the Email button on the app's "Taster bookings" screen,
// once they've been checked in as a taster.
// Records when, how many times and by whom, so the app shows "Emailed ...".
// GA only. POST { booking_id }
export default async function tasterEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { booking_id: bookingId } = req.body as { booking_id?: string };
  if (!isValidObjectId(bookingId)) {
    return res.status(400).json({ message: "Booking is required" });
  }
  const ga = await requireGA(req, res);
  if (!ga) return undefined;

  const booking = await TasterBookings.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  // "Great to meet you" - only once they've actually come
  if (!booking.attended_at) {
    return res
      .status(400)
      .json({ message: "They haven't been checked in as a taster yet" });
  }

  try {
    await sendTasterFollowUpEmail(booking);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "💥 Taster follow-up email failed:",
      (error as Error).message
    );
    return res
      .status(502)
      .json({ message: "Couldn't send the email - please try again" });
  }
  await TasterBookings.updateOne(
    { _id: booking._id },
    {
      follow_up_sent_at: new Date(),
      follow_up_by: ga._id,
      $inc: { follow_up_count: 1 },
    }
  );
  return res
    .status(200)
    .json({ message: `Email sent to ${booking.first_name}` });
}
