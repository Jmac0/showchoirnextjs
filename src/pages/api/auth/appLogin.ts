import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

const jwtSecret = process.env.JWT_SECRET as string;
export default async function appLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  await dbConnect();
  // find valid user from db
  const user = await Members.findOne({ email }).select("password");
  // return 404 if user not found or Password is not valid
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Not authorized" });
  }
  const { id } = user;
  // if everything is fine create an access token & a refresh token
  const accessToken = Jwt.sign({ id }, jwtSecret, { expiresIn: "15s" });
  const refreshToken = Jwt.sign({ id }, jwtSecret);
  // return tokens
  return res.status(200).json({ accessToken, refreshToken });
}
