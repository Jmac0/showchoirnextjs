import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// For the website's admin-only API routes (e.g. managing Music & Lyrics).
// Uses the website login, and checks the member's CURRENT role in the
// database (not just the role saved in their login), so taking away admin
// works straight away. Returns the admin's member document, or sends a
// 401/403 and returns null - callers should just `return` then.
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    res.status(401).json({ message: "Please log in again" });
    return null;
  }

  await dbConnect();
  const admin = await Members.findOne({ email });
  if (admin?.role !== "admin") {
    res.status(403).json({ message: "Admins only" });
    return null;
  }
  return admin;
}
