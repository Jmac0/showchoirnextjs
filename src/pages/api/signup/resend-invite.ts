import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { canInvite, cleanEmail, DD_MEMBERS_FILTER } from "@/src/lib/ddMembers";
import { inviteKindFor } from "@/src/lib/ddMembersShared";
import { sendInviteEmail } from "@/src/lib/email/sendInviteEmail";
import { canInviteFlexi, FLEXI_MEMBERS_FILTER } from "@/src/lib/flexiMembers";
import Members from "@/src/lib/models/member";

// At most one set-up email per member this often, however many times it's
// asked for
const RESEND_AFTER_MS = 10 * 60 * 1000;

// Always the same answer, so nobody can use this to find out who's a member
const ANSWER = {
  message:
    "If you're a member who hasn't set up their account yet, we've emailed you a link. It can take a few minutes to arrive.",
};

/* "Didn't get your invite?" on the log in page: an existing member brought
over from GoCardless (Direct Debit - "DD members" admin page) or Mailchimp
(Flexi - "Flexi members" admin page) types their email and gets their set-up
link (the invite email) again.
POST { email }

Only sends to imported members who haven't set up their account yet (Direct
Debit ones only with an active mandate) - and never says whether the email
belongs to a member. */
export default async function resendInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const email = cleanEmail(req.body?.email);
  if (!email) {
    return res.status(400).json({ message: "Please enter your email" });
  }

  try {
    await dbConnect();
    const member = await Members.findOne({
      email,
      $or: [DD_MEMBERS_FILTER, FLEXI_MEMBERS_FILTER],
    }).select("+password");

    const sentRecently =
      member?.invite?.sent_at &&
      Date.now() - new Date(member.invite.sent_at).getTime() < RESEND_AFTER_MS;
    const kind = member ? inviteKindFor(member) : "dd";
    const allowed =
      member && (kind === "flexi" ? canInviteFlexi(member) : canInvite(member));
    if (allowed && !sentRecently) {
      await sendInviteEmail(member, kind);
    }
  } catch (error) {
    // Logged for us - the member still gets the same answer
    // eslint-disable-next-line no-console
    console.error("💥 Resend invite failed:", (error as Error).message);
  }
  return res.status(200).json(ANSWER);
}
