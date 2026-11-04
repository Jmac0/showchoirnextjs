import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { HeadersType } from "@/src/types/types";

// For admin routes used by BOTH the website and the app (Announcements).
// The app sends its login as a "Bearer" token; the website uses its own
// login (requireAdmin). Either way the member's CURRENT role in the
// database must be "admin". Returns the admin's member document, or sends a
// 401/403 and returns null - callers should just `return` then.
export async function requireAdminAnyLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.headers.authorization) return requireAdmin(req, res);

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) {
    res.status(401).json({ message: "Not authorized" });
    return null;
  }

  await dbConnect();
  const admin = await Members.findById(payload.id);
  if (admin?.role !== "admin") {
    res.status(403).json({ message: "Admins only" });
    return null;
  }
  return admin;
}
