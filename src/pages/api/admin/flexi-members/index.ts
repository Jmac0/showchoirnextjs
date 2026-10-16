import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listFlexiMembers } from "@/src/lib/flexiMembers";

// Flexi members admin - existing Flexi members brought over from Mailchimp
// (admins only).
//   GET   everyone on the page, with their invite status and sessions
export default async function flexiMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method === "GET") {
    return res.status(200).json({ members: await listFlexiMembers() });
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ message: "Method Not Allowed" });
}
