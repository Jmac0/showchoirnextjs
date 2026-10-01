import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { isFlexiProduct } from "@/src/lib/stripe/flexiProducts";
import { stripe } from "@/src/lib/stripe/stripeSetup";
// Flexi sign-up: creates the new member's record and a Stripe Checkout page
// to pay for their first pack of 10 sessions. When they've paid, the webhook
// (api/stripe/webhooks.ts) activates them and emails the create-account link.
// eslint-disable-next-line consistent-return
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    consent,
    ageConfirm,
    homeChoir,
    concession: type,
    email: rawEmail,
    phoneNumber,
    postCode,
    county,
    townOrCity,
    streetAddress,
    lastName,
    firstName,
  } = req.body;
  // Stored lower case, like every login looks it up (the app lower-cases
  // what's typed, so "Jo@X.com" saved as-is could never log in there)
  const email = String(rawEmail || "")
    .toLowerCase()
    .trim();

  if (req.method === "POST") {
    // Only the Flexi packs can be bought here
    if (!isFlexiProduct(type)) {
      return res.status(400).json({ message: "Please choose a Flexi option" });
    }
    try {
      await dbConnect();

      // check if member already exists
      const existing = await Members.findOne({ email }).select("+password");
      // Someone who started signing up but never paid (they backed out of
      // Stripe) can try again - their details are updated below. Anyone
      // else with this email is a real member and should log in instead.
      const isUnpaidSignUp =
        existing &&
        existing.membership_type === "flexi" &&
        !existing.date_joined &&
        !existing.active_member &&
        !existing.password;
      if (existing && !isUnpaidSignUp) {
        return res
          .status(401)
          .json({ message: "Member already exists please login" });
      }

      const product = await stripe.products.retrieve(type);
      const details = {
        first_name: firstName,
        last_name: lastName,
        street_address: streetAddress,
        county,
        town_city: townOrCity,
        post_code: postCode,
        phone_number: phoneNumber,
        email,
        topUpDate: [],
        active_member: false,
        date_joined: "",
        home_choir: homeChoir,
        age_confirm: ageConfirm,
        consent,
        membership_type: "flexi",
        flexi_sessions: 0,
        flexi_type: product.name,
      };
      // Create the member before they pay - the webhook activates them and
      // emails the create-account link once the payment goes through.
      if (existing) {
        await Members.updateOne({ _id: existing.id }, details);
      } else {
        await Members.create(details);
      }
      // get the product including the price_id
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // add the price id to the session
            price: product.default_price as string,
            quantity: 1,
          },
        ],
        customer_email: email,
        mode: "payment",
        success_url: `${req.headers.origin}/new-account-redirect-page`,
        cancel_url: `${req.headers.origin}/flexi-membership`,
        automatic_tax: { enabled: false },
        payment_intent_data: {
          metadata: {
            orderItems: product.name,
            user: email,
          },
        },
      });
      res.status(203).json({ sessionUrl: session.url as string });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
