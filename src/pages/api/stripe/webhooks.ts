import { format } from "date-fns";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";

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
// updates a member on successful payment of a Flexi membership
/* eslint-disable consistent-return */
const handleWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") return res.status(400);
  // return and end early to keep Stripe happy
  res.status(200).end();
  await dbConnect();
  try {
    // create a new date to add as date joined
    const date = format(new Date(), "dd-MM-yyyy").toString();
    // get the stripe signature
    const sig = req.headers["stripe-signature"];
    // convert req to buffer
    const buf = await buffer(req);
    // returns a 400 if signature is invalid
    const stripeEvent = stripe.webhooks.constructEvent(
      buf,
      sig as string,
      process.env.STRIPE_ENDPOINT_SECRET as string
    );
    const {
      id,
      data: {
        object: {
          metadata: { user, orderItems },
        },
      },
    } = stripeEvent;

    // Check if the event has been processed before
    const existingEvent = await StripeEventLog.findOne({
      stripeEvent: id,
    });

    if (existingEvent) {
      // Event is a duplicate, do not process it again
      // eslint-disable-next-line no-console
      console.log("Duplicate event received:", id);
      return;
    }

    switch (stripeEvent.type) {
      case "payment_intent.succeeded":
        if (orderItems.includes("Flexi")) {
          const topUp = { type: orderItems, date };
          // update the member record
          await Members.findOneAndUpdate(
            {
              email: user,
              $or: [
                { date_joined: "" }, // Only update if date_joined is an empty string
                { date_joined: { $exists: false } }, // Also update if date_joined doesn't exist
              ],
            },
            {
              date_joined: date,
              active_member: true,
              $push: { topUpDate: topUp },
              $inc: { flexi_sessions: 10 },
              flexi_type: orderItems,
            },
            { new: true, upsert: true }
          );
          await StripeEventLog.create({ stripeEvent: id });
        }
        break;
      default: {
        res.status(400).end();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // lets handle any errors coming from stripe
    throw new Error(error.message);
  }
};

export default handleWebhook;
