import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { applyCors } from "@/src/lib/cors";
import { checkShopDelivery, startPaymentSheet } from "@/src/lib/shop";

/* The app's kit shop "Pay now": pays inside the app with Stripe's payment
sheet (card, Apple Pay, Google Pay), like the app's Flexi top-up
(flexi-payment-sheet.ts). The website goes to Stripe's checkout page instead
(api/shop/checkout.ts).

POST { lines: [{ product_id, size, quantity }], venue, note }, logged in on
the app (Bearer token), active members only. Saves the order (pending),
priced from the products - never from the app - and returns:
  clientSecret   - this payment, for the sheet to complete
  publishableKey - Stripe's public key for this site (test on the dev
                   preview, live on the real site)
  orderId, reference, amountPence

When the payment goes through, Stripe calls api/stripe/webhooks.ts, which
marks the order paid and sends the emails - the payment carries the same
"shop" metadata as the website's. The app also asks
api/member-resources/shop-order.ts straight away, so it needn't wait.

Apple and Google don't take a cut (or require their own payments) here:
it's physical kit, handed out at rehearsals. */
export default async function shopPaymentSheet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const member = await requireActiveMember(req, res);
  if (!member) return undefined;

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    // eslint-disable-next-line no-console
    console.error("💥 STRIPE_PUBLISHABLE_KEY isn't set");
    return res
      .status(500)
      .json({ message: "Payments aren't available right now" });
  }

  const { lines, venue, note } = (req.body || {}) as Record<string, unknown>;

  try {
    // A real choir to deliver to, and a note that isn't too long
    const delivery = await checkShopDelivery(venue, note);
    if ("error" in delivery) {
      return res.status(400).json({ message: delivery.error });
    }

    const result = await startPaymentSheet(member, { lines, ...delivery });
    if ("error" in result) {
      return res.status(400).json({ message: result.error });
    }
    return res.status(200).json({
      clientSecret: result.clientSecret,
      publishableKey,
      orderId: result.orderId,
      reference: result.reference,
      amountPence: result.total_pence,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Shop payment sheet:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Couldn't start the payment - please try again" });
  }
}
