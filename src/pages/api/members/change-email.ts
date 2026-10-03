import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import crypto from "node:crypto";

import dbConnect from "@/src/lib/dbConnect";
import { cleanEmail, isEmail } from "@/src/lib/ddMembers";
import { sendConfirmEmailChange } from "@/src/lib/email/sendConfirmEmailChange";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// How long the link in the confirmation email works
const LINK_HOURS = 24;

/* Change email, step 1 - from the dashboard's Account tab
(components/members/ChangeEmailForm.tsx). Nothing changes yet: it checks
their password and that nobody else uses the new email, then emails a link
to the NEW address. Clicking it (api/members/confirm-email.ts) makes the
change - in our database, GoCardless and Mailchimp. So a typo can't lock
them out: they'd never get the link, and their old email keeps working.
POST { currentPassword, newEmail } */
export default async function changeEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who: the member logged in to the website ---

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    return res.status(401).json({ message: "Please log in again" });
  }

  const { currentPassword } = req.body as { currentPassword?: string };
  const newEmail = cleanEmail(req.body?.newEmail);
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ message: "Please enter your password" });
  }
  if (!isEmail(newEmail)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }
  if (newEmail === email) {
    return res
      .status(400)
      .json({ message: "That's already your email address" });
  }

  try {
    await dbConnect();
    const member = await Members.findOne({ email }).select("+password");
    if (!member?.password) {
      return res.status(404).json({ message: "Account not found" });
    }
    // Their password, so someone at a computer left logged in can't do it
    if (!(await bcrypt.compare(currentPassword, member.password))) {
      return res.status(400).json({ message: "Your password is incorrect" });
    }
    if (await Members.exists({ email: newEmail })) {
      return res
        .status(409)
        .json({ message: "Another member already uses that email" });
    }

    // --- Remember the change, and send the link to the new address ---

    const token = crypto.randomBytes(32).toString("hex");
    await Members.updateOne(
      { _id: member.id },
      {
        pending_email: {
          email: newEmail,
          token_hash: crypto.createHash("sha256").update(token).digest("hex"),
          expires_at: new Date(Date.now() + LINK_HOURS * 60 * 60 * 1000),
        },
      }
    );
    await sendConfirmEmailChange(member, newEmail, token);

    return res.status(200).json({
      message: `Nearly done - we've emailed a link to ${newEmail}. Click it to confirm your new email (it works for ${LINK_HOURS} hours).`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Change email failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Something went wrong - please try again" });
  }
}
