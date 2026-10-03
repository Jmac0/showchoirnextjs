import { Resend } from "resend";

import { EmailTemplate } from "@/src/components/emails/EmailTemplate";

type NewMember = {
  email: string;
  first_name: string;
  last_name?: string;
  phone_number?: string | number;
};

// Sends a new member the "Welcome to Show Choir" email, with the link to
// create their account (see components/emails/EmailTemplate.tsx).
// Used when a flexi sign-up's first payment arrives (api/stripe/webhooks.ts)
// and by api/gocardless/webhooks.ts (Direct Debit sign-ups).
//
// If the email can't be sent, the admin is emailed the member's details so
// they can get in touch, and the original error is thrown.
// Returns Resend's response (includes the email's id).
export async function sendWelcomeEmail(member: NewMember) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    return await resend.sendEmail({
      from: `${process.env.FROM_EMAIL}`,
      to: member.email,
      subject: "Welcome to Show Choir",
      react: EmailTemplate({ name: member.first_name, email: member.email }),
    });
  } catch (error) {
    // Let the admin know, so the new member isn't left without a way in
    await resend
      .sendEmail({
        from: `${process.env.FROM_EMAIL}`,
        to: `${process.env.ADMIN_EMAIL}`,
        subject: "Email Problem",
        html: `The welcome email to a new member couldn't be sent:<br>
          email: ${member.email}<br>
          name: ${member.first_name} ${member.last_name || ""}<br>
          phone: ${member.phone_number || ""}`,
      })
      .catch(() => {
        // Nothing more we can do - the caller logs the original error
      });
    throw error;
  }
}
