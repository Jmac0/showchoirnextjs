import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listFlexiMembers } from "@/src/lib/flexiMembers";
import {
  isValidSessionCount,
  MAX_CONFIRMED_SESSIONS,
  MIN_CONFIRMED_SESSIONS,
} from "@/src/lib/flexiMembersShared";
import { addPaperSessions, correctFlexiBalance } from "@/src/lib/flexiSessions";
import Members from "@/src/lib/models/member";

// Flexi members admin - a member's sessions (admins only).
//   PUT { sessions }   whole number, negative if they owe some
// Not confirmed yet: the sessions from their paper record, added to their
//   balance (usually a GA does this at the desk the first time they're
//   scanned - this is for when the records are with the admin).
// Already confirmed: corrects their balance to this number.
export default async function setSessions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  const sessions = req.body?.sessions;
  if (!isValidSessionCount(sessions)) {
    return res.status(400).json({
      message: `Sessions must be a whole number from ${MIN_CONFIRMED_SESSIONS} to ${MAX_CONFIRMED_SESSIONS}`,
    });
  }
  if (
    !isValidObjectId(id) ||
    !(await Members.exists({ _id: id, imported_from_mailchimp: true }))
  ) {
    return res.status(404).json({ message: "Member not found" });
  }

  // Not confirmed yet -> paper sessions added; otherwise a correction
  const added = await addPaperSessions({
    memberId: String(id),
    sessions,
    byId: admin.id,
  });
  if (!added) await correctFlexiBalance(String(id), sessions);
  return res.status(200).json({ members: await listFlexiMembers() });
}
