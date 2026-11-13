import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import {
  passwordCheckPassed,
  startPasswordCheck,
  TOO_MANY_ATTEMPTS,
} from "@/src/lib/loginLimiter";
import Members from "@/src/lib/models/member";
import { BCRYPT_ROUNDS, MIN_PASSWORD_LENGTH } from "@/src/lib/passwordRules";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";
import { HeadersType } from "@/src/types/types";

/* Lets a member change their password, from the website dashboard's Account
tab (components/members/ChangePasswordForm.tsx) or the app's Account tab -
logged in on the website (session) or in the app (Bearer token).

They must give their current password, so someone using a computer they've
left logged in can't change it. Changing it also signs them out of the app
on every phone (their app refresh tokens are cleared), in case someone else
knew the old password - except the phone they're changing it from, which
sends its own refresh token to keep. Website logins elsewhere are ended too;
the one they're changing it from stays logged in. Wrong current passwords
count towards the login limit (lib/loginLimiter.ts), so it can't be guessed.
POST { currentPassword, newPassword, keepRefreshToken? } */
export default async function changePassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who: the app sends a token, the website has a session ---

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  let email: string | undefined;
  // The website login making the change ([...nextauth].ts) - it stays in
  let websiteSid = "";
  if (payload) {
    await dbConnect();
    email = (await Members.findById(payload.id).select("email"))?.email;
  } else {
    const session = await getServerSession(req, res, authOptions);
    email = session?.user?.email || undefined;
    websiteSid = session?.sid || "";
  }
  if (!email) {
    return res.status(401).json({ message: "Please log in again" });
  }

  // --- Check the new password ---

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res
      .status(400)
      .json({ message: "Please enter your current password" });
  }
  if (
    typeof newPassword !== "string" ||
    newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      message: `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({
      message: "Your new password must be different from your current one",
    });
  }

  try {
    await dbConnect();
    // The password isn't returned unless asked for (select: false)
    const member = await Members.findOne({ email }).select("+password");
    if (!member?.password) {
      return res.status(404).json({ message: "Account not found" });
    }

    // --- Check their current password is right ---

    if (await startPasswordCheck(member.id)) {
      return res.status(429).json({ message: TOO_MANY_ATTEMPTS });
    }
    if (!(await bcrypt.compare(currentPassword, member.password))) {
      return res
        .status(400)
        .json({ message: "Your current password is incorrect" });
    }
    await passwordCheckPassed(member.id);

    // --- Save the new one and sign them out of the app everywhere ---

    // From the app: keep the phone they're using logged in
    const { keepRefreshToken } = req.body as { keepRefreshToken?: string };
    const keep =
      payload &&
      typeof keepRefreshToken === "string" &&
      (member.refresh_tokens || []).includes(keepRefreshToken)
        ? [keepRefreshToken]
        : [];
    await Members.updateOne(
      { _id: member.id },
      {
        password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        refresh_tokens: keep,
        password_changed_at: new Date(),
        // From the website: keep this login, end the others
        password_changed_by: websiteSid,
      }
    );

    return res.status(200).json({
      message: payload
        ? "Your password has been changed. You've been logged out on your other phones and computers."
        : "Your password has been changed. You've been logged out on your other phones and computers - this one stays logged in.",
      status: 200,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
}
