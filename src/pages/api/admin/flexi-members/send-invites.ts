import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { MAX_INVITES_PER_REQUEST } from "@/src/lib/ddMembersShared";
import { canInviteFlexi, listFlexiMembers } from "@/src/lib/flexiMembers";
import { MemberType } from "@/src/lib/models/member";
import { inviteIds, sendInvites } from "@/src/lib/sendInvites";

// Flexi members admin - send invite emails (admins only).
//   POST { ids }   emails each of these members the link to set up their
//                  account (Flexi wording). Only imported Flexi members who
//                  haven't already created theirs.
//                  Returns who was sent / who failed, and the updated list.
export default async function sendFlexiInvites(
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

  const result = await sendInvites(ids, "flexi", (member: MemberType) =>
    canInviteFlexi(member) && member.imported_from_mailchimp
      ? null
      : "Not an imported Flexi member"
  );
  return res.status(200).json({ ...result, members: await listFlexiMembers() });
}
