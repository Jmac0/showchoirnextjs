import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { HeadersType, UserDataType } from "@/src/types/types";

// Returns the logged-in member's profile for the app (JWT-authenticated).
export default async function getProfile(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) return res.status(401).json({ message: "Not authorized" });

  await dbConnect();

  const member = await Members.findById(payload.id);
  if (!member) return res.status(404).json({ message: "Member not found" });

  const userData: UserDataType = {
    email: member.email,
    active_member: member.active_member,
    flexi_sessions: member.flexi_sessions || 0,
    flexi_type: member.flexi_type,
    active_mandate: member.active_mandate || false,
    first_name: member.first_name,
    last_name: member.last_name,
    membership_type: member.membership_type,
  };

  return res.status(200).json(userData);
}
