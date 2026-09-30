import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { isFlexiProduct } from "@/src/lib/stripe/flexiProducts";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// Lets a logged-in member buy another pack of 10 Flexi sessions from their
// dashboard (Account tab). New members use checkout_flexi.ts instead, which
// also creates their account.
//
// Returns a Stripe Checkout URL to send the member to. When they've paid,
// Stripe calls api/stripe/webhooks.ts, which adds the 10 sessions.
// POST { product } - one of the ids in lib/stripe/flexiProducts.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who is buying: the member logged in to the website ---

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    return res.status(401).json({ message: "Please log in to buy sessions" });
  }

  // --- What they're buying: full price or concession pack ---

  const { product: productId } = req.body as { product?: string };
  if (!isFlexiProduct(productId)) {
    return res.status(400).json({ message: "Please choose a Flexi option" });
  }

  try {
    await dbConnect();
    const member = await Members.findOne({ email });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // The price charged is the product's default price in Stripe
    const product = await stripe.products.retrieve(productId as string);

    // --- Create the Stripe Checkout page ---

    const origin = req.headers.origin || `https://${req.headers.host}`;
    // Back to the dashboard's Account tab, which shows a message from ?topup=
    const accountUrl = `${origin}/members/dashboard?component=account`;

    const checkout = await stripe.checkout.sessions.create({
      line_items: [{ price: product.default_price as string, quantity: 1 }],
      customer_email: member.email,
      mode: "payment",
      success_url: `${accountUrl}&topup=success`,
      cancel_url: `${accountUrl}&topup=cancelled`,
      automatic_tax: { enabled: false },
      // Read by the webhook when the payment succeeds - same as sign-ups:
      //   orderItems - product name, e.g. "Flexi Non Concession"
      //   user       - the member's email, to find who to add sessions to
      payment_intent_data: {
        metadata: { orderItems: product.name, user: member.email },
      },
    });

    return res.status(200).json({ sessionUrl: checkout.url as string });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}
