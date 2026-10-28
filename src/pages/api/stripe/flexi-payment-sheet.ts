import { NextApiRequest, NextApiResponse } from "next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { canBuyFlexi, flexiProductFor } from "@/src/lib/stripe/flexiProducts";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import { HeadersType } from "@/src/types/types";

/* The app's "Buy 10 more sessions": a Flexi member pays inside the app with
Stripe's payment sheet (card, Apple Pay, Google Pay) instead of going to the
website's Checkout page (checkout_flexi_topup.ts does that for the website).

POST, logged in on the app (Bearer token). Starts a Stripe payment for their
pack and returns what the app's payment sheet needs:
  clientSecret    - this payment, for the sheet to complete
  publishableKey  - Stripe's public key for this site (test key on the dev
                    preview, live key on the real site), so the app never has
                    a key built in and always matches the site it talks to
  amountPence     - what they'll be charged

When the payment goes through, Stripe calls api/stripe/webhooks.ts, which
adds the 10 sessions - the metadata below is the same as Checkout's, so the
webhook can't tell the difference and needs nothing extra.

Apple doesn't take a cut (or allow its in-app purchase) here: Flexi sessions
are for singing at real rehearsals, a service used outside the app. */
export default async function flexiPaymentSheet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who is buying: the member logged in to the app ---

  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  if (!payload) return res.status(401).json({ message: "Please log in again" });

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    // eslint-disable-next-line no-console
    console.error("💥 STRIPE_PUBLISHABLE_KEY isn't set");
    return res
      .status(500)
      .json({ message: "Payments aren't available right now" });
  }

  try {
    await dbConnect();
    const member = await Members.findById(payload.id);
    if (!member)
      return res.status(401).json({ message: "Please log in again" });

    // Flexi is being phased out: only members already on Flexi can buy more
    // packs (the app only shows them the option)
    if (!canBuyFlexi(member)) {
      return res.status(403).json({
        message: "Flexi packs are only available to existing Flexi members",
      });
    }

    // --- What they're buying: their pack (concession or full price) ---

    // Charged at the product's default price in Stripe, same as Checkout
    const product = await stripe.products.retrieve(flexiProductFor(member).id);
    const price = await stripe.prices.retrieve(product.default_price as string);
    if (!price.unit_amount) {
      throw new Error(`Flexi product ${product.id} has no default price`);
    }

    const payment = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      // Card, Apple Pay, Google Pay - whatever's turned on in Stripe
      automatic_payment_methods: { enabled: true },
      receipt_email: member.email,
      // Read by the webhook when the payment succeeds - same as Checkout:
      //   orderItems - product name, e.g. "Flexi Non Concession"
      //   user       - the member's email, to find who to add sessions to
      metadata: { orderItems: product.name, user: member.email },
    });

    return res.status(200).json({
      clientSecret: payment.client_secret,
      publishableKey,
      amountPence: price.unit_amount,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("💥 Flexi payment sheet:", err.message);
    return res
      .status(500)
      .json({ message: "Couldn't start the payment - please try again" });
  }
}
