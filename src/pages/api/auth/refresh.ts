import { NextApiRequest, NextApiResponse } from "next";

import { signAccessToken, verifyRefreshToken } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

// The app swaps its 30-day refresh token for a new 15-minute access token.
// Only refresh tokens still in the member's list work - logging out
// (appLogout.ts), changing or resetting the password takes them out.
const refresh = async (req: NextApiRequest, res: NextApiResponse) => {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { refreshToken } = req.body || {};
  // return 401 if no refresh token
  if (!refreshToken) return res.status(401).json({ message: "Not authorized" });

  // Reject an expired or tampered-with refresh token (or an access token, or
  // anything that isn't a string) before touching the DB.
  if (!verifyRefreshToken(refreshToken)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await dbConnect();

  // find the member with this session's refresh token
  const currentMember = await Members.findOne({ refresh_tokens: refreshToken });
  // return 403 if no member found
  if (!currentMember)
    return res.status(403).json({ message: "Not authorized" });
  // if all is good create a new access token
  return res
    .status(200)
    .json({ accessToken: signAccessToken(currentMember.id) });
};
export default refresh;
