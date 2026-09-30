import { format } from "date-fns";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import StripeEventLog from "@/src/lib/models/stripeEventLogSchema";
import { stripe } from "@/src/lib/stripe/stripeSetup";
// This part is necessary so that NextJS doesn't parse the request body
// Otherwise it will manipulate it and stripe will reject it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Called by Stripe when a payment succeeds. Adds a pack of 10 Flexi sessions
// to the member who paid - both new sign-ups (checkout_flexi.ts) and
// existing members topping up (checkout_flexi_topup.ts).
//
// The reply tells Stripe whether we've dealt with the event:
//   200 - done (or nothing for us to do), don't send it again
//   400 - not really from Stripe (bad signature), ignored
//   500 - something went wrong saving it, so Stripe retries later
// That's why we only reply once the member has been updated: replying 200
// first would mean a failed save is never retried and the member never gets
// the sessions they paid for.
const handleWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  // --- Check the event really came from Stripe ---

  let stripeEvent: Stripe.Event;
  try {
    // The raw body is needed to check Stripe's signature
    const buf = await buffer(req);
    stripeEvent = stripe.webhooks.constructEvent(
      buf,
      req.headers["stripe-signature"] as string,
      process.env.STRIPE_ENDPOINT_SECRET as string
    );
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Webhook error: ${(error as Error).message}` });
  }

  // --- Only Flexi payments need anything doing ---

  // Set on the payment by checkout_flexi.ts / checkout_flexi_topup.ts
  const { user, orderItems } =
    (stripeEvent.data.object as { metadata?: Record<string, string> })
      .metadata || {};

  if (
    stripeEvent.type !== "payment_intent.succeeded" ||
    !orderItems?.includes("Flexi") ||
    !user
  ) {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    await dbConnect();

    // Stripe can send the same event more than once - only act on it once
    const { id } = stripeEvent;
    if (await StripeEventLog.findOne({ stripeEvent: id })) {
      // eslint-disable-next-line no-console
      console.log("Duplicate event received:", id);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // --- Add a pack of 10 sessions ---

    // "dd-MM-yyyy", for the top-up history and the join date
    const date = format(new Date(), "dd-MM-yyyy").toString();

    // $inc adds to whatever they have, so a member who owes sessions after
    // "pay later" at a rehearsal (e.g. -1) ends up with 9.
    // No upsert: the member always exists by now (sign-ups are created before
    // they pay), and upserting used to create a duplicate member for anyone
    // who had already joined.
    const member = await Members.findOneAndUpdate(
      { email: user },
      {
        active_member: true,
        $push: { topUpDate: { type: orderItems, date } },
        $inc: { flexi_sessions: 10 },
        flexi_type: orderItems,
      },
      { new: true }
    );

    if (!member) {
      // They've paid but we can't find them - needs sorting out by hand.
      // (Not a 500: retrying wouldn't find them either.)
      // eslint-disable-next-line no-console
      console.error(`💥 Flexi payment for unknown member: ${user} (${id})`);
    } else if (!member.date_joined) {
      // First payment for a new sign-up - they've now joined
      await Members.updateOne({ _id: member.id }, { date_joined: date });
    }

    // Log it last, so an event that failed part-way is processed again
    await StripeEventLog.create({ stripeEvent: id });

    return res.status(200).json({ received: true });
  } catch (error) {
    // Database down etc. - Stripe will retry the event later
    // eslint-disable-next-line no-console
    console.error("💥 Stripe webhook failed:", (error as Error).message);
    return res.status(500).json({ message: "Webhook handler failed" });
  }
};

export default handleWebhook;
