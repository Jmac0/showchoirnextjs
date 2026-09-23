import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m"; // configurable via environment variable
const jwtRefreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY || "30d";

export default async function appLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  try {
    const { email: rawEmail, password: rawPassword } = req.body as {
      email: string;
      password: string;
    };
    // Validate input
    if (!rawEmail || !rawPassword) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const email = rawEmail.toLowerCase().trim();
    const password = rawPassword.trim();

    await dbConnect();

    // Find user by email and select password for verification
    const user = await Members.findOne({ email }).select("+password");

    // Return 401 if user not found or password is invalid
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { id } = user;

    // Create access and refresh tokens
    const accessToken = Jwt.sign({ id }, jwtSecret, {
      expiresIn: jwtAccessTokenExpiry,
    });
    const refreshToken = Jwt.sign({ id }, jwtSecret, {
      expiresIn: jwtRefreshTokenExpiry,
    });

    // Keep any other sessions' refresh tokens that haven't expired yet, drop
    // any that have, and add this new session's token - so logging in on a
    // second device doesn't sign the first device out.
    const stillValidTokens = (user.refresh_tokens || []).filter(
      (token: string) => {
        try {
          Jwt.verify(token, jwtSecret);
          return true;
        } catch {
          return false;
        }
      }
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
