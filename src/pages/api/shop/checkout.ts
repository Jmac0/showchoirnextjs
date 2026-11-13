import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import { isMembershipActive } from "@/src/lib/directDebit";
import Members from "@/src/lib/models/member";
import { checkShopDelivery, startCheckout } from "@/src/lib/shop";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

/* Members' kit shop - pay for the basket (active members only).
  POST { lines: [{ product_id, size, quantity }], venue, note }
  -> { sessionUrl } - Stripe's checkout page to send the member to
When they've paid, Stripe calls api/stripe/webhooks.ts, which marks the
order paid. Prices are worked out here from the products, never taken from
the browser. */
export default async function shopCheckout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    return res.status(401).json({ message: "Please log in again" });
  }

  const { lines, venue, note } = (req.body || {}) as Record<string, unknown>;

  try {
    await dbConnect();
    const member = await Members.findOne({ email });
    if (!member || !isMembershipActive(member)) {
      return res
        .status(403)
        .json({ message: "The shop is for active members only" });
    }

    // A real choir to deliver to, and a note that isn't too long
    const delivery = await checkShopDelivery(venue, note);
    if ("error" in delivery) {
      return res.status(400).json({ message: delivery.error });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const result = await startCheckout(member, { lines, ...delivery }, origin);
    if ("error" in result) {
      return res.status(400).json({ message: result.error });
    }
    return res.status(200).json({ sessionUrl: result.url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Shop checkout failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Couldn't start the payment - please try again" });
  }
}
