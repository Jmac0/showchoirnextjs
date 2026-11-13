import { NextApiRequest, NextApiResponse } from "next";

import { verifyRefreshToken } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

// Logging out of the app: takes this phone's refresh token out of the
// member's list, so it can't get any more access tokens (any access token
// already given out lasts its last few minutes). The app deletes its own
// copies whatever we answer, so this always says OK - an unknown or expired
// token has nothing left to end.
export default async function appLogout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { refreshToken } = req.body || {};
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return res.status(200).json({ loggedOut: true });

  try {
    await dbConnect();
    await Members.updateOne(
      { _id: payload.id },
      { $pull: { refresh_tokens: refreshToken } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("App logout failed:", (error as Error).message);
  }
  return res.status(200).json({ loggedOut: true });
}
