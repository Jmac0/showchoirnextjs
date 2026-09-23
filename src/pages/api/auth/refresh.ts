import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import { applyCors } from "@/src/lib/cors";
import Members from "@/src/lib/models/member";

const refresh = async (req: NextApiRequest, res: NextApiResponse) => {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { refreshToken } = req.body;
  // return 401 if no refresh token
  if (!refreshToken) return res.status(401);

  // Reject an expired or tampered-with refresh token before touching the DB.
  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET as string);
  } catch {
    return res.status(403).json({ message: "Not authorized" });
  }

  // find the member with this session's refresh token
  const currentMember = await Members.findOne({ refresh_tokens: refreshToken });
  // return 403 if no member found
  if (!currentMember)
    return res.status(403).json({ message: "Not authorized" });
  // if all is good create a new access token
  const accessToken = jwt.sign(
    { id: currentMember.id },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m" }
  );
  return res.status(200).json({ accessToken });
};
export default refresh;
