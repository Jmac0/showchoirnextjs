import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import Members from "@/src/lib/models/member";

const refresh = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { refreshToken } = req.body;
  // return 401 if no refresh token
  if (!refreshToken) return res.status(401);
  // find the member with the refresh token
  const currentMember = await Members.findOne({ refresh_token: refreshToken });
  // return 403 if no member found
  if (!currentMember)
    return res.status(403).json({ message: "Not authorized" });
  // if all is good create a new access token
  const newAccessToken = jwt.sign(
    { id: currentMember.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
  return res.status(200).json({ token: newAccessToken });
};
export default refresh;
