import { format } from "date-fns";
import { Resend } from "resend";

import { DirectDebitEnded, graceEndsAt } from "@/src/lib/directDebit";

type EndedMember = { first_name: string; last_name: string; email: string };

// Tells the admin (ADMIN_EMAIL) that a member's Direct Debit has stopped -
// who, what happened, why, and when their grace period ends - so someone can
// get in touch. Sent by the GoCardless webhook (api/gocardless/webhooks.ts).
// Throws if the email can't be sent (the webhook logs it and carries on).
export async function sendDirectDebitEndedEmail(
  members: EndedMember[],
  ended: DirectDebitEnded
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const date = (value: Date | string | null) =>
    value ? format(new Date(value), "EEEE d MMMM yyyy") : "?";
  const names = members.map((m) => `${m.first_name} ${m.last_name}`);
  const what = ended.event.replace(/_/g, " ");

  return resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: `${process.env.ADMIN_EMAIL}`,
    subject: `Direct Debit ${what}: ${names.join(", ")}`,
    html: `<p>A member's Direct Debit has stopped (${what}).</p>
      <ul>${members
        .map((m) => `<li>${m.first_name} ${m.last_name} - ${m.email}</li>`)
        .join("")}</ul>
      <p><b>When:</b> ${date(ended.at)}<br>
      <b>Reason:</b> ${ended.description || ended.cause || "not given"}<br>
      <b>Membership stays active until:</b> ${date(
        graceEndsAt({ direct_debit_ended: ended })
      )}</p>
      <p>They've been told on their Account page and in the app, with a link
      to set up a new Direct Debit.</p>`,
  });
}
