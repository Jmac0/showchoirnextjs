import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { applyCors } from "@/src/lib/cors";
import { confirmAppOrder } from "@/src/lib/shop";

/* The app, straight after its payment sheet says the kit order is paid.
  GET ?id=<order id> -> { order, paid }
The member's own order only (404 otherwise). If Stripe's message to the
webhook hasn't arrived yet, this asks Stripe and marks it paid itself, so
the thank-you shows straight away (lib/shop.ts confirmAppOrder). */
export default async function appShopOrder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const member = await requireActiveMember(req, res);
  if (!member) return undefined;

  try {
    const result = await confirmAppOrder(req.query.id, member._id);
    if (!result) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 App shop order failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Couldn't check your order - please try again" });
  }
}
