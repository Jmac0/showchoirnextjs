import { Resend } from "resend";

import { InviteEmail } from "@/src/components/emails/InviteEmail";
import Members from "@/src/lib/models/member";

type InvitedMember = {
  id: string;
  email: string;
  first_name: string;
};

// Emails an existing Direct Debit member the link to set up their account
// (components/emails/InviteEmail.tsx), and records that it was sent - so the
// "DD members" admin page shows who's been invited and how many times.
// Throws if the email couldn't be sent (nothing is recorded then).
export async function sendInviteEmail(member: InvitedMember) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const response = await resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: member.email,
    subject: "Your Show Choir membership card is ready",
    react: InviteEmail({ name: member.first_name, email: member.email }),
  });

  await Members.updateOne(
    { _id: member.id },
    {
      "invite.status": "sent",
      "invite.sent_at": new Date(),
      $inc: { "invite.send_count": 1 },
    }
  );
  return response;
}
