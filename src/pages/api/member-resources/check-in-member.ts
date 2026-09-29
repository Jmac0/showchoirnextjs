import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { HeadersType } from "@/src/types/types";

// A flexi member scanned again within this window isn't charged a second
// session, so an accidental double scan at rehearsal is harmless.
// Defaults to 12 hours; set CHECKIN_COOLDOWN_SECONDS (e.g. 30) to shorten it for testing.
const CHECKIN_COOLDOWN_SECONDS =
  Number(process.env.CHECKIN_COOLDOWN_SECONDS) || 12 * 60 * 60;

export type CheckInStatus =
  | "mandate" // active Direct Debit, nothing deducted
  | "flexi" // one flexi session deducted
  | "already_checked_in" // flexi member already charged within the cooldown
  | "no_sessions"
  | "not_found";

export type CheckInResponse = {
  status: CheckInStatus;
  first_name?: string;
  last_name?: string;
  flexi_sessions?: number;
};

// Called from the app when a GA scans a member's QR code: confirms they're a
// paid-up member and, for flexi members, uses up one session.
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

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) return res.status(401).json({ message: "Not authorized" });

  const { email: rawEmail } = req.body as { email?: string };
  if (!rawEmail || typeof rawEmail !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }
  const email = rawEmail.toLowerCase().trim();

  await dbConnect();

  const scanner = await Members.findById(payload.id);
  if (scanner?.role !== "ga") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const member = await Members.findOne({ email });
  if (!member) {
    return res.status(200).json({ status: "not_found" } as CheckInResponse);
  }

  const name = { first_name: member.first_name, last_name: member.last_name };

  if (member.active_mandate) {
    return res.status(200).json({ status: "mandate", ...name });
  }

  const now = new Date();
  const cooldownStart = new Date(
    now.getTime() - CHECKIN_COOLDOWN_SECONDS * 1000
  );

  // Deduct atomically, and only if they have a session left and haven't been
  // charged within the cooldown, so two quick scans can't both deduct.
  const updated = await Members.findOneAndUpdate(
    {
      _id: member.id,
      flexi_sessions: { $gt: 0 },
      $or: [
        { last_checkin: { $exists: false } },
        { last_checkin: null },
        { last_checkin: { $lt: cooldownStart } },
      ],
    },
    { $inc: { flexi_sessions: -1 }, $set: { last_checkin: now } },
    { new: true }
  );

  if (updated) {
    return res.status(200).json({
      status: "flexi",
      ...name,
      flexi_sessions: updated.flexi_sessions,
    });
  }

  // Nothing was deducted - re-read to report why.
  const current = await Members.findById(member.id);
  const sessions = current?.flexi_sessions || 0;
  const recentlyCheckedIn =
    current?.last_checkin && current.last_checkin >= cooldownStart;

  if (recentlyCheckedIn) {
    return res.status(200).json({
      status: "already_checked_in",
      ...name,
      flexi_sessions: sessions,
    });
  }

  return res
    .status(200)
    .json({ status: "no_sessions", ...name, flexi_sessions: sessions });
}
