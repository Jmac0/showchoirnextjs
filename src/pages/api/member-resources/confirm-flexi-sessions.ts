import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import {
  isValidSessionCount,
  MAX_CONFIRMED_SESSIONS,
  MIN_CONFIRMED_SESSIONS,
} from "@/src/lib/flexiMembersShared";
import { addPaperSessions } from "@/src/lib/flexiSessions";
import Members from "@/src/lib/models/member";

/* A GA has checked an imported Flexi member's paper record and entered how
many sessions they have left (before tonight) - added to their balance
(lib/flexiSessions.ts). The app calls this after check-in-member answered
"confirm_sessions", then scans them in again - which then works as for any
Flexi member (uses a session, or offers payment if they have none).

POST { email, sessions }   sessions: whole number, negative if they owe some
Only while their sessions are still unconfirmed - if another GA got there
first, nothing changes and it says so (409). GAs only. */
export default async function confirmFlexiSessions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email: rawEmail, sessions } = req.body || {};
  if (typeof rawEmail !== "string" || !rawEmail.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!isValidSessionCount(sessions)) {
    return res.status(400).json({
      message: `Sessions must be a whole number from ${MIN_CONFIRMED_SESSIONS} to ${MAX_CONFIRMED_SESSIONS}`,
    });
  }

  // Only GAs (sends 401/403 itself if not)
  const ga = await requireGA(req, res);
  if (!ga) return undefined;

  const member = await Members.findOne({
    email: rawEmail.toLowerCase().trim(),
  });
  if (!member) return res.status(404).json({ message: "Member not found" });

  const updated = await addPaperSessions({
    memberId: member.id,
    sessions,
    byId: ga.id,
  });
  if (!updated) {
    return res.status(409).json({
      message: `${member.first_name}'s sessions have already been entered (${
        member.flexi_sessions || 0
      }) - scan them again`,
    });
  }
  return res.status(200).json({
    first_name: updated.first_name,
    flexi_sessions: updated.flexi_sessions,
  });
}
