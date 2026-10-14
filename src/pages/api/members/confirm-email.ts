import { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

import { changeMemberEmail } from "@/src/lib/changeMemberEmail";
import dbConnect from "@/src/lib/dbConnect";
import Members, { isDuplicateEmailError } from "@/src/lib/models/member";

/* Change email, step 2 - the link in the email sent to their new address
(pages/account/confirm-email.tsx sends the token here). Changes it in
GoCardless (if it has their old email), our database and Mailchimp - see
lib/changeMemberEmail.ts.

They then log in with the new email. POST { token } */
export default async function confirmEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = String(req.body?.token || "");
  const invalid = () =>
    res.status(400).json({
      message:
        "This link has expired or already been used - please ask to change your email again from your Account page",
    });
  if (!/^[0-9a-f]{64}$/.test(token)) return invalid();

  try {
    await dbConnect();
    const member = await Members.findOne({
      "pending_email.token_hash": crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      "pending_email.expires_at": { $gt: new Date() },
    });
    if (!member?.pending_email?.email) return invalid();

    const newEmail: string = member.pending_email.email;
    // Someone else may have taken it since they asked
    if (await Members.exists({ email: newEmail })) {
      return res
        .status(409)
        .json({ message: "Another member already uses that email" });
    }

    await changeMemberEmail(member, newEmail);

    return res.status(200).json({ email: newEmail });
  } catch (error) {
    // Taken at the very same moment (the database allows one per email)
    if (isDuplicateEmailError(error)) {
      return res
        .status(409)
        .json({ message: "Another member already uses that email" });
    }
    // eslint-disable-next-line no-console
    console.error("💥 Confirm email failed:", (error as Error).message);
    return res.status(500).json({
      message:
        "Sorry, we couldn't change your email - please try the link again",
    });
  }
}
