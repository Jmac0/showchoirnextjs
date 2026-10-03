import { Resend } from "resend";

// Tells the admin (ADMIN_EMAIL) a member deleted their account - mainly so
// someone can check a Direct Debit member also cancelled their Direct
// Debit (deleting the account doesn't stop it). Throws if it can't be sent.
export async function sendAccountDeletedEmail(member: {
  first_name: string;
  last_name: string;
  email: string;
  membership_type?: string;
  active_mandate?: boolean;
  go_cardless_id?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const directDebitNote = member.active_mandate
    ? `<p><b>Their Direct Debit was still active</b> - they were told to
       cancel it with their bank. GoCardless customer: ${
         member.go_cardless_id || "unknown"
       }.</p>`
    : "";
  return resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: `${process.env.ADMIN_EMAIL}`,
    subject: `Account deleted: ${member.first_name} ${member.last_name}`,
    html: `<p>${member.first_name} ${member.last_name} (${member.email}, ${
      member.membership_type || "no membership"
    }) deleted their account.
      Their details and check-in history have been removed, and they've been
      archived in Mailchimp.</p>${directDebitNote}`,
  });
}
