import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { decryptEmail } from "@/src/lib/encryptEmail";
import { memberJoined } from "@/src/lib/memberAudience";
import Members from "@/src/lib/models/member";
import {
  BCRYPT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT,
} from "@/src/lib/passwordRules";

// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-extraneous-dependencies
const bcrypt = require("bcrypt");

/* An existing Direct Debit member finishing their account, from the link in
their invite email (pages/register/welcome.tsx): saves their details, home
choir and password. They're already a paying, active member (imported from
GoCardless), so there's no payment step and their Direct Debit details are
left alone.

Like createPassword, the member is identified by the encrypted email
("token") from the emailed link - not an email typed in - so only someone
with the link can claim the account, and it only works once (not if they
already have a password).
POST { token, firstName, lastName, streetAddress, townOrCity, county,
       postCode, phoneNumber, homeChoir, ageConfirm, consent, password } */
export default async function completeAccount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body || {};
  const email = typeof body.token === "string" ? decryptEmail(body.token) : "";
  if (!email) {
    return res.status(400).json({
      message: "This link isn't valid - please use the link in your email",
    });
  }

  const text = (value: unknown) => String(value || "").trim();
  if (
    !text(body.firstName) ||
    !text(body.lastName) ||
    !text(body.homeChoir) ||
    body.ageConfirm !== true ||
    body.consent !== true
  ) {
    return res.status(400).json({ message: "Please fill in all the fields" });
  }
  if (
    typeof body.password !== "string" ||
    body.password.length < MIN_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      message: PASSWORD_TOO_SHORT,
    });
  }

  try {
    await dbConnect();
    const member = await Members.findOne({ email }).select("+password");
    if (!member) {
      return res
        .status(404)
        .json({ message: "We can't find a membership for this email" });
    }
    if (member.password) {
      return res.status(401).json({
        message: "You've already set up your account - please log in",
      });
    }

    await Members.updateOne(
      { _id: member.id },
      {
        first_name: text(body.firstName),
        last_name: text(body.lastName),
        street_address: text(body.streetAddress),
        town_city: text(body.townOrCity),
        county: text(body.county),
        post_code: text(body.postCode),
        phone_number: text(body.phoneNumber),
        home_choir: text(body.homeChoir),
        age_confirm: true,
        consent: true,
        password: bcrypt.hashSync(body.password, BCRYPT_ROUNDS),
        "invite.status": "accepted",
        "invite.accepted_at": new Date(),
      }
    );
    // An existing Direct Debit member: make sure they're in the Mailchimp
    // Choir audience, with their home choir (skipped if not set up)
    await memberJoined({
      id: member.id,
      email,
      first_name: String(body.firstName).trim(),
      last_name: String(body.lastName).trim(),
      home_choir: String(body.homeChoir).trim(),
    });
    return res.status(200).json({ message: "Account created" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Complete account failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Something went wrong - please try again" });
  }
}
