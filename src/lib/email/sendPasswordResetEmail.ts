import { Resend } from "resend";

// Emails the "reset your password" link (api/members/forgot-password.ts).
// It opens pages/auth/reset-password.tsx. Throws if it can't be sent.
export async function sendPasswordResetEmail(
  member: { first_name: string; email: string },
  token: string,
  minutes: number
) {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.sendEmail({
    from: `${process.env.FROM_EMAIL}`,
    to: member.email,
    subject: "Reset your Show Choir password",
    html: `<p>Hi ${member.first_name || "there"},</p>
      <p>Someone (hopefully you) asked to reset the password for your Show
      Choir account. Click the link below to choose a new one - it works for
      ${minutes} minutes, once.</p>
      <p><a href="${link}">Choose a new password</a></p>
      <p>If you didn't ask, you can ignore this email - your password won't
      change.</p>`,
  });
}
