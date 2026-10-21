import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { activeMembersReport } from "@/src/lib/reports";

// Active members report (admins only).
//   GET    how many members are active right now, by type and home choir
export default async function activeMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  return res.status(200).json(await activeMembersReport());
}
