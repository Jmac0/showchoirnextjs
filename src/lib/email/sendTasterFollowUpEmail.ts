import { Resend } from "resend";

import { TasterFollowUpEmail } from "@/src/components/emails/TasterFollowUpEmail";

// Sends the "great to meet you - here's how to join" email to someone who
// booked a taster (components/emails/TasterFollowUpEmail.tsx). Replies go to
// ADMIN_EMAIL. Throws if it can't be sent.
export async function sendTasterFollowUpEmail(booking: {
  first_name: string;
  email: string;
  choir: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const response = await resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: booking.email,
    ...(process.env.ADMIN_EMAIL ? { reply_to: process.env.ADMIN_EMAIL } : {}),
    subject: `Great to meet you at Show Choir ${booking.choir}!`,
    react: TasterFollowUpEmail({
      firstName: booking.first_name,
      choir: booking.choir,
      joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/monthly-membership`,
    }),
  });
  return response;
}
