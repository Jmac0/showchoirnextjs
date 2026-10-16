import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { canInvite, listDDMembers } from "@/src/lib/ddMembers";
import { MAX_INVITES_PER_REQUEST } from "@/src/lib/ddMembersShared";
import { MemberType } from "@/src/lib/models/member";
import { inviteIds, sendInvites } from "@/src/lib/sendInvites";

// DD members admin - send invite emails (admins only).
//   POST { ids }   emails each of these members the link to set up their
//                  account. Only members with an active Direct Debit
//                  mandate who haven't already created theirs.
//                  Returns who was sent / who failed, and the updated list.
export default async function sendDDInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const ids = inviteIds(req.body);
  if (!ids) {
    return res.status(400).json({
      message: `Send between 1 and ${MAX_INVITES_PER_REQUEST} invites at a time`,
    });
  }

  const result = await sendInvites(ids, "dd", (member: MemberType) =>
    canInvite(member) ? null : "Direct Debit isn't active - not invited"
  );
  return res.status(200).json({ ...result, members: await listDDMembers() });
}
