import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import {
  directDebitNotice,
  hasActiveDirectDebit,
  isMembershipActive,
} from "@/src/lib/directDebit";
import { checkFlexiExpiry } from "@/src/lib/flexiExpiryCheck";
import Members from "@/src/lib/models/member";
import { HeadersType, UserDataType } from "@/src/types/types";

// Returns the logged-in member's profile for the app (JWT-authenticated).
export default async function getProfile(
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

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) return res.status(401).json({ message: "Not authorized" });

  await dbConnect();

  const member = await Members.findById(payload.id);
  if (!member) return res.status(404).json({ message: "Member not found" });
  // Flexi: expire their sessions if they haven't checked in for 6 months
  // (updates `member`), or get the warning if that's coming up
  const flexiExpiry = await checkFlexiExpiry(member);

  const userData: UserDataType = {
    email: member.email,
    active_member: member.active_member,
    flexi_sessions: member.flexi_sessions || 0,
    flexi_type: member.flexi_type,
    // Includes the grace period after a Direct Debit stops
    active_mandate: hasActiveDirectDebit(member),
    // If their Direct Debit has stopped: when, why and the grace period - the
    // app's home screen shows a notice
    direct_debit: directDebitNotice(member),
    // Hide the membership card (QR code) once a Direct Debit membership has
    // ended - the app shows how to set up a new one instead
    card_active: isMembershipActive(member),
    flexi_expiry: flexiExpiry,
    flexi_expired_at: member.flexi_expired?.at
      ? new Date(member.flexi_expired.at).toISOString()
      : null,
    first_name: member.first_name,
    last_name: member.last_name,
    membership_type: member.membership_type,
    role: member.role || "",
  };

  return res.status(200).json(userData);
}
