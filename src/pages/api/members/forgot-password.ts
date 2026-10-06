import { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import { cleanEmail } from "@/src/lib/ddMembers";
import { sendPasswordResetEmail } from "@/src/lib/email/sendPasswordResetEmail";
import Members from "@/src/lib/models/member";

// How long the emailed link works
const LINK_MINUTES = 60;
// At most one email per member this often, however many times it's asked
// (enough to stop an inbox being flooded, short enough not to confuse)
const RESEND_AFTER_MS = 60 * 1000;

// Always the same answer, so nobody can use this to find out who's a member
const ANSWER = {
  message:
    "If that email belongs to a member, we've sent a link to reset your password. It can take a few minutes to arrive - check your spam folder too. Use the most recent email - older links stop working when a new one is sent.",
};

/* "Forgot your password?" step 1 (pages/auth/forgot-password.tsx, also
opened from the app's login screen). Emails a link to reset it - the next
step is api/members/reset-password.ts. Only a hash of the link's token is
stored, it works for LINK_MINUTES, once. Never says whether the email is a
member's. POST { email } */
export default async function forgotPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
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
    const member = await Members.findOne({ email });
    const sentAt = member?.password_reset?.sent_at;
    const sentRecently =
      sentAt && Date.now() - new Date(sentAt).getTime() < RESEND_AFTER_MS;

    if (member && !sentRecently) {
      const token = crypto.randomBytes(32).toString("hex");
      const saved = await Members.updateOne(
        { _id: member.id },
        {
          password_reset: {
            token_hash: crypto.createHash("sha256").update(token).digest("hex"),
            expires_at: new Date(Date.now() + LINK_MINUTES * 60 * 1000),
            sent_at: new Date(),
          },
        }
      );
      // Never email a link that wasn't saved (it couldn't work) - e.g. a dev
      // server started before password_reset was added to the model
      if (!saved.modifiedCount) {
        throw new Error("The reset link wasn't saved - no email sent");
      }
      await sendPasswordResetEmail(member, token, LINK_MINUTES);
    }
  } catch (error) {
    // Logged for us - they still get the same answer
    // eslint-disable-next-line no-console
    console.error("💥 Forgot password failed:", (error as Error).message);
  }
  return res.status(200).json(ANSWER);
}
