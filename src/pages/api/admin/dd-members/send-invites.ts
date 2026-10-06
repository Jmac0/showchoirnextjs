import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { canInvite, listDDMembers } from "@/src/lib/ddMembers";
import { MAX_INVITES_PER_REQUEST } from "@/src/lib/ddMembersShared";
import { sendInviteEmail } from "@/src/lib/email/sendInviteEmail";
import Members from "@/src/lib/models/member";

// Resend allows about 2 emails a second
const GAP_BETWEEN_EMAILS_MS = 600;

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// DD members admin - send invite emails (admins only).
//   POST { ids }   emails each of these members the link to set up their
//                  account. Only members with an active Direct Debit
//                  mandate who haven't already created theirs.
//                  Returns who was sent / who failed, and the updated list.
export default async function sendInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const ids: string[] = Array.isArray(req.body?.ids)
    ? req.body.ids.map(String)
    : [];
  if (ids.length === 0 || ids.length > MAX_INVITES_PER_REQUEST) {
    return res.status(400).json({
      message: `Send between 1 and ${MAX_INVITES_PER_REQUEST} invites at a time`,
    });
  }

  // Only people who haven't set up their account yet
  const members = await Members.find({
    _id: { $in: ids },
    "invite.status": { $ne: "accepted" },
  }).select("+password");

  const sent: string[] = [];
  const failed: { id: string; name: string; message: string }[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, member] of members.entries()) {
    const name = `${member.first_name} ${member.last_name}`;
    if (!canInvite(member)) {
      failed.push({
        id: member.id,
        name,
        message: member.password
          ? "Already has an account"
          : "Direct Debit isn't active - not invited",
      });
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    if (index > 0) await wait(GAP_BETWEEN_EMAILS_MS);
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendInviteEmail(member);
      sent.push(member.id);
    } catch (error) {
      failed.push({ id: member.id, name, message: (error as Error).message });
    }
  }

  return res.status(200).json({ sent, failed, members: await listDDMembers() });
}
