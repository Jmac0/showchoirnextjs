import { Resend } from "resend";

// Emails the link to confirm a change of email - to the NEW address, so a
// typo can't lock them out (they'd just never get it, and their old email
// keeps working). The link opens pages/account/confirm-email.tsx.
// Throws if it can't be sent.
export async function sendConfirmEmailChange(
  member: { first_name: string },
  newEmail: string,
  token: string
) {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/account/confirm-email?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: newEmail,
    subject: "Confirm your new email for Show Choir",
    html: `<p>Hi ${member.first_name},</p>
      <p>Please confirm this is your new email address for your Show Choir
      membership by clicking the link below. It works for 24 hours.</p>
      <p><a href="${link}">Confirm my new email</a></p>
      <p>If you didn't ask to change your email, you can ignore this - nothing
      will change.</p>`,
  });
}
