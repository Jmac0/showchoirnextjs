import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import {
  clearLoginFailures,
  ipFrom,
  isLoginBlocked,
  recordLoginFailure,
  TOO_MANY_ATTEMPTS,
} from "@/src/lib/loginLimiter";
import Members from "@/src/lib/models/member";

export default async function appLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  try {
    const { email: rawEmail, password: rawPassword } = req.body as {
      email: string;
      password: string;
    };
    // Validate input - plain text only, so nothing but an email can reach
    // the database query
    if (
      typeof rawEmail !== "string" ||
      typeof rawPassword !== "string" ||
      !rawEmail ||
      !rawPassword
    ) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const email = rawEmail.toLowerCase().trim();
    // Exactly as typed (spaces included) - same as the website's login
    const password = rawPassword;
    const ip = ipFrom(req.headers);

    await dbConnect();

    // Too many wrong passwords recently (lib/loginLimiter.ts)
    if (await isLoginBlocked(email, ip)) {
      return res.status(429).json({ message: TOO_MANY_ATTEMPTS });
    }

    // Find user by email and select password for verification
    const user = await Members.findOne({ email }).select("+password");

    // Return 401 if user not found, has no password yet, or the password
    // is wrong (same message for all, so emails can't be tested)
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      await recordLoginFailure(email, ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    await clearLoginFailures(email);

    const { id } = user;

    // Create access and refresh tokens (lib/auth/verifyJWT.ts - how long
    // each lasts, and why they're marked as which is which)
    const accessToken = signAccessToken(id);
    const refreshToken = signRefreshToken(id);

    // Keep any other sessions' refresh tokens that haven't expired yet, drop
    // any that have, and add this new session's token - so logging in on a
    // second device doesn't sign the first device out.
    const stillValidTokens = (user.refresh_tokens || []).filter(
      (token: string) => !!verifyRefreshToken(token)
    );

    await Members.findByIdAndUpdate(id, {
      refresh_tokens: [...stillValidTokens, refreshToken],
    });

    // Return tokens to the user
    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    // Handle any errors that may occur
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
