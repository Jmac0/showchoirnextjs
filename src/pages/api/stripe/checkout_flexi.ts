import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { stripe } from "@/src/lib/stripe/stripeSetup";
// Handle function, creates db entry for the new member and a Stripe checkout session
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
    email,
    phoneNumber,
    postCode,
    county,
    townOrCity,
    streetAddress,
    lastName,
    firstName,
  } = req.body;

  if (req.method === "POST") {
    try {
      await dbConnect();

      // check if member already exists
      const memberExists = await Members.findOne({ email });
      if (memberExists) {
        return res
          .status(401)
          .json({ message: "Member already exists please login" });
      }
      const product = await stripe.products.retrieve(type);
      // create new member record
      await Members.create({
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
      });
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
