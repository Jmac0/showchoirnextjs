import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import dbConnect from "@/src/lib/dbConnect";
import { isMembershipActive } from "@/src/lib/directDebit";
import Members from "@/src/lib/models/member";
import { HeadersType } from "@/src/types/types";

// For the app's members-only content (notifications, Music & Lyrics): the
// member must be logged in (Bearer token) AND their membership active - not
// a Direct Debit that stopped over 14 days ago, or expired Flexi sessions
// (isMembershipActive in lib/directDebit.ts). Returns the member, or sends a
// 401/403 and returns null - callers should just `return` then.
export async function requireActiveMember(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) {
    res.status(401).json({ message: "Not authorized" });
    return null;
  }

  await dbConnect();
  const member = await Members.findById(payload.id);
  if (!member) {
    res.status(401).json({ message: "Not authorized" });
    return null;
  }
  if (!isMembershipActive(member)) {
    res.status(403).json({ message: "Your membership isn't active" });
    return null;
  }
  return member;
}
