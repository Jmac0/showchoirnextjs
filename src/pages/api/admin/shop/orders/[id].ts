import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { setFulfilment } from "@/src/lib/shop";
import { isFulfilment } from "@/src/lib/shopShared";

/* One kit shop order (admins only) - how it's getting on.
  PATCH { fulfilment: "new" | "ordered" | "delivered" | "cancelled" }
  -> { ok: true }
Refunds are done in the Stripe dashboard; mark the order "cancelled" here. */
export default async function adminShopOrder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const { fulfilment } = (req.body || {}) as Record<string, unknown>;
  if (!isFulfilment(fulfilment)) {
    return res.status(400).json({ message: "Please choose a status" });
  }
  if (!(await setFulfilment(req.query.id, fulfilment))) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.status(200).json({ ok: true });
}
