import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listDDMembers } from "@/src/lib/ddMembers";

// DD members admin - existing Direct Debit members brought over from
// GoCardless (admins only).
//   GET   everyone on the page, with their invite status
export default async function ddMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  if (req.method === "GET") {
    return res.status(200).json({ members: await listDDMembers() });
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ message: "Method Not Allowed" });
}
