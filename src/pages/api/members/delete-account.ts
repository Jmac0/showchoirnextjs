import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import { sendAccountDeletedEmail } from "@/src/lib/email/sendAccountDeletedEmail";
import { archiveContact } from "@/src/lib/mailchimp";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";
import { HeadersType } from "@/src/types/types";

/* "Delete my account" - from the Danger zone on the website's Account page
(components/members/DeleteAccount.tsx) and the app's Account tab (Apple
requires apps with accounts to offer this). Permanently:

  - deletes their member record and their check-in history
  - archives them in both Mailchimp audiences
  - emails the admin (so a Direct Debit can be checked)

It does NOT cancel a Direct Debit - they do that with their bank (they're
warned first). Needs their password. Logged in on the website (session) or
in the app (Bearer token). POST { currentPassword } */
export default async function deleteAccount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { currentPassword } = req.body as { currentPassword?: string };
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ message: "Please enter your password" });
  }

  try {
    // --- Who: the app sends a token, the website has a session ---

    await dbConnect();
    const payload = getJWTPayload(req.headers as HeadersType["headers"]);
    let member = payload
      ? await Members.findById(payload.id).select("+password")
      : null;
    if (!payload) {
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.email) {
        member = await Members.findOne({ email: session.user.email }).select(
          "+password"
        );
      }
    }
    if (!member?.password) {
      return res.status(401).json({ message: "Please log in again" });
    }
    if (!(await bcrypt.compare(currentPassword, member.password))) {
      return res.status(400).json({ message: "Your password is incorrect" });
    }

    // --- Delete everything ---

    await Checkins.deleteMany({ member_id: member.id });
    await Members.deleteOne({ _id: member.id });
    // Never stop the deletion for these (both log their own problems)
    await archiveContact(member.email);
    try {
      await sendAccountDeletedEmail(member);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "💥 Account deleted email failed:",
        (error as Error).message
      );
    }

    return res.status(200).json({ message: "Your account has been deleted" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Delete account failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Something went wrong - please try again" });
  }
}
