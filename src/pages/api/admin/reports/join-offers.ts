import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { joinOfferMembers } from "@/src/lib/reports";

// Members who signed up with an offer code, e.g. the Walton launch night's
// "£10 to start" (admins only). GET.
export default async function joinOffers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  return res.status(200).json({ members: await joinOfferMembers() });
}
