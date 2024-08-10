import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m"; // configurable via environment variable
const jwtRefreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d"; // refresh tokens should have a long expiry

export default async function appLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    await dbConnect();

    // Find user by email and select password for verification
    const user = await Members.findOne({ email }).select("password");

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

    // Save the refresh token to the user in the database
    await Members.findByIdAndUpdate(id, { refresh_token: refreshToken });

    // Return tokens to the user
    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    // Handle any errors that may occur
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
