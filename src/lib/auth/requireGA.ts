import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { HeadersType } from "@/src/types/types";

// For the app's GA-only routes. Returns the logged-in GA's member document,
// or sends a 401/403 and returns null - callers should just `return` then.
export async function requireGA(req: NextApiRequest, res: NextApiResponse) {
  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) {
    res.status(401).json({ message: "Not authorized" });
    return null;
  }

  await dbConnect();

  const ga = await Members.findById(payload.id);
  if (ga?.role !== "ga") {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return ga;
}
