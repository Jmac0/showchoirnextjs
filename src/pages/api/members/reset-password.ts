import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

import dbConnect from "@/src/lib/dbConnect";
import { clearLoginFailures } from "@/src/lib/loginLimiter";
import Members from "@/src/lib/models/member";
import {
  BCRYPT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT,
} from "@/src/lib/passwordRules";

/* "Forgot your password?" step 2 - the emailed link's page
(pages/auth/reset-password.tsx) sends its token and the new password.
Sets it, uses up the link, logs them out of the app on every phone (in case
someone else had their old password) and clears any login lock-out, so
they can log straight in. POST { token, password } */
export default async function resetPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = String(req.body?.token || "");
  const { password } = req.body as { password?: unknown };
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return res.status(400).json({
      message:
        "This link has expired or already been used - please ask for a new one",
    });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: PASSWORD_TOO_SHORT });
  }

  try {
    await dbConnect();
    const member = await Members.findOne({
      "password_reset.token_hash": crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      "password_reset.expires_at": { $gt: new Date() },
    });
    if (!member) {
      return res.status(400).json({
        message:
          "This link has expired or already been used - please ask for a new one",
      });
    }

    await Members.updateOne(
      { _id: member.id },
      {
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        refresh_tokens: [],
        $unset: { password_reset: 1 },
      }
    );
    await clearLoginFailures(member.email);

    return res
      .status(200)
      .json({ message: "Your password has been changed - please log in" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Reset password failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Something went wrong - please try again" });
  }
}
