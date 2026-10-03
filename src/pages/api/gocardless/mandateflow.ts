import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { goCardlessClient } from "@/src/lib/gocardless";
import Members, { isDuplicateEmailError } from "@/src/lib/models/member";

/* Monthly (Direct Debit) sign-up: saves the new member's details, then asks
GoCardless for a link to its hosted Direct Debit form and returns it, for
pages/monthly-membership.tsx to send them to. POST - the sign-up form data.

They're saved as NOT active. GoCardless calls api/gocardless/webhooks.ts once
they've completed its form, and that marks them active and emails them the
link to create their account. (Moved here from the old Express app.) */
export default async function mandateFlow(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    firstName,
    lastName,
    email: rawEmail,
    county,
    postCode,
    phoneNumber,
    streetAddress,
    townOrCity,
    ageConfirm,
    homeChoir,
    consent,
  } = req.body;

  // Stored lower case, like every login looks it up
  const email = String(rawEmail || "")
    .toLowerCase()
    .trim();
  if (!email || !firstName || !lastName) {
    return res.status(400).json({ message: "Please fill in all the fields" });
  }
  // Spam sign-ups mostly come from .ru addresses
  if (email.endsWith(".ru")) {
    return res
      .status(400)
      .json({ message: "Please provide a valid UK, EU or US email address" });
  }

  try {
    await dbConnect();

    // --- Existing member? ---

    const existing = await Members.findOne({ email }).select("+password");
    // Someone who started a monthly sign-up but never finished the GoCardless
    // form can try again - their details are updated below. Anyone else with
    // this email is a real member (e.g. flexi) and must not be reset - they
    // should log in instead.
    const isUnfinishedSignUp =
      existing &&
      ["DD", "Monthly"].includes(existing.membership_type) &&
      !existing.active_mandate &&
      !existing.active_member &&
      !existing.date_joined &&
      !existing.password;
    if (existing && !isUnfinishedSignUp) {
      return res
        .status(401)
        .json({ message: "Member already exists please login" });
    }

    // --- Save them, not active yet (the webhook activates them) ---

    const details = {
      first_name: firstName,
      last_name: lastName,
      email,
      post_code: postCode,
      phone_number: phoneNumber,
      street_address: streetAddress,
      town_city: townOrCity,
      county,
      age_confirm: ageConfirm,
      home_choir: homeChoir,
      consent,
      active_mandate: false,
      active_member: false,
      date_joined: "",
      mandate: "",
      // "DD" - what the website and app check for Direct Debit members
      membership_type: "DD",
      go_cardless_id: "",
      topUpDate: [],
    };
    if (existing) {
      await Members.updateOne({ _id: existing.id }, details);
    } else {
      await Members.create(details);
    }

    // --- Get the link to GoCardless's Direct Debit form ---

    const client = goCardlessClient();
    const origin = req.headers.origin || `https://${req.headers.host}`;

    // A billing request for a Bacs Direct Debit mandate...
    const billingRequest = await client.billingRequests.create({
      mandate_request: { scheme: "bacs" },
    });
    // ...and the hosted form for it, with their details filled in
    const flow = await client.billingRequestFlows.create({
      lock_currency: true,
      // After the form: "check your email for a link to create an account"
      redirect_uri: `${origin}/new-account-redirect-page`,
      // If they back out of the form
      exit_uri: `${origin}/monthly-membership`,
      prefilled_customer: {
        given_name: firstName,
        family_name: lastName,
        address_line1: streetAddress,
        city: townOrCity,
        region: county,
        postal_code: postCode,
        email,
      },
      links: { billing_request: billingRequest.id as string },
    });

    // monthly-membership.tsx sends them to this URL
    return res.status(200).json({ authorisation_url: flow.authorisation_url });
  } catch (error) {
    // Someone else signed up with this email at the same moment (e.g. a
    // double-click) - the database only allows one account per email
    if (isDuplicateEmailError(error)) {
      return res
        .status(401)
        .json({ message: "Member already exists please login" });
    }
    // eslint-disable-next-line no-console
    console.error("💥 GoCardless sign-up failed:", (error as Error).message);
    return res.status(500).json({
      message: "Sorry, we couldn't start your Direct Debit - please try again",
    });
  }
}
