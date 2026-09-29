import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import { ukDate } from "@/src/lib/ukDate";

export type CheckInStatus =
  | "mandate" // active Direct Debit, nothing deducted
  | "flexi" // one flexi session deducted
  | "already_checked_in" // already scanned in at this rehearsal, not charged again
  | "no_sessions"
  | "not_found";

export type CheckInResponse = {
  status: CheckInStatus;
  first_name?: string;
  last_name?: string;
  flexi_sessions?: number;
};

const VENUE_SLUG = /^[a-z0-9-]+$/;

// MongoDB's error code for breaking a unique index
const DUPLICATE_KEY = 11000;

// Called from the app when a GA scans a member's QR code at a rehearsal:
// confirms they're a paid-up member, records them as here (see the Checkin
// model) and, for flexi members, uses up one session.
export default async function checkInMember(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email: rawEmail, venue } = req.body as {
    email?: string;
    venue?: string;
  };
  if (!rawEmail || typeof rawEmail !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }
  if (typeof venue !== "string" || !VENUE_SLUG.test(venue)) {
    return res.status(400).json({ message: "Venue is required" });
  }
  const email = rawEmail.toLowerCase().trim();

  const ga = await requireGA(req, res);
  if (!ga) return res;

  const member = await Members.findOne({ email });
  if (!member) {
    return res.status(200).json({ status: "not_found" } as CheckInResponse);
  }

  const name = { first_name: member.first_name, last_name: member.last_name };
  const rehearsal = { member_id: member.id, venue, session_date: ukDate() };

  const alreadyCheckedIn = () =>
    res.status(200).json({
      status: "already_checked_in",
      ...name,
      // Only flexi members have a session count worth showing
      ...(member.active_mandate
        ? {}
        : { flexi_sessions: member.flexi_sessions || 0 }),
    });

  // Not a paid-up member. Checked before recording them, but a repeat scan of
  // someone who used their last session on the first scan is "already here".
  if (!member.active_mandate && !(member.flexi_sessions > 0)) {
    if (await Checkins.exists(rehearsal)) return alreadyCheckedIn();
    return res
      .status(200)
      .json({ status: "no_sessions", ...name, flexi_sessions: 0 });
  }

  // Record them as here. The unique index on member + venue + date rejects a
  // second check-in at the same rehearsal, so double scans aren't charged.
  let checkin;
  try {
    checkin = await Checkins.create({
      ...rehearsal,
      first_name: member.first_name,
      last_name: member.last_name,
      membership_type: member.membership_type,
      scanned_at: new Date(),
      scanned_by: ga.id,
      flexi_deducted: false,
    });
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      return alreadyCheckedIn();
    }
    throw error;
  }

  if (member.active_mandate) {
    return res.status(200).json({ status: "mandate", ...name });
  }

  // Flexi: deduct one session, only if they still have one (atomic, so two
  // GAs scanning at once can't take the balance below zero).
  const updated = await Members.findOneAndUpdate(
    { _id: member.id, flexi_sessions: { $gt: 0 } },
    { $inc: { flexi_sessions: -1 } },
    { new: true }
  );

  if (!updated) {
    // Their last session went between reading and deducting - undo the check-in.
    await Checkins.deleteOne({ _id: checkin.id });
    return res
      .status(200)
      .json({ status: "no_sessions", ...name, flexi_sessions: 0 });
  }

  await Checkins.updateOne({ _id: checkin.id }, { flexi_deducted: true });

  return res.status(200).json({
    status: "flexi",
    ...name,
    flexi_sessions: updated.flexi_sessions,
  });
}
