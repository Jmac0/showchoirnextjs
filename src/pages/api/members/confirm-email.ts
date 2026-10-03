import { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

import dbConnect from "@/src/lib/dbConnect";
import { goCardlessClient } from "@/src/lib/gocardless";
import { changeContactEmail } from "@/src/lib/mailchimp";
import Members from "@/src/lib/models/member";

/* Change email, step 2 - the link in the email sent to their new address
(pages/account/confirm-email.tsx sends the token here). Changes it:

  1. GoCardless - if they pay by Direct Debit and the GoCardless customer
     has their old email. First, so if GoCardless fails nothing changes and
     the two never disagree. (Not for an extra singer on someone else's
     Direct Debit - that customer is the payer.)
  2. Our database - their login email from now on
  3. Mailchimp - both audiences, if they're in them (never blocks the change)

They then log in with the new email. POST { token } */
export default async function confirmEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = String(req.body?.token || "");
  const invalid = () =>
    res.status(400).json({
      message:
        "This link has expired or already been used - please ask to change your email again from your Account page",
    });
  if (!/^[0-9a-f]{64}$/.test(token)) return invalid();

  try {
    await dbConnect();
    const member = await Members.findOne({
      "pending_email.token_hash": crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      "pending_email.expires_at": { $gt: new Date() },
    });
    if (!member?.pending_email?.email) return invalid();

    const oldEmail: string = member.email;
    const newEmail: string = member.pending_email.email;
    // Someone else may have taken it since they asked
    if (await Members.exists({ email: newEmail })) {
      return res
        .status(409)
        .json({ message: "Another member already uses that email" });
    }

    // --- 1. GoCardless (only if it has their old email) ---

    if (member.go_cardless_id && !member.paid_by_member) {
      const client = goCardlessClient();
      const customer = await client.customers.find(member.go_cardless_id);
      if (
        String(customer.email || "")
          .toLowerCase()
          .trim() === oldEmail
      ) {
        await client.customers.update(member.go_cardless_id, {
          email: newEmail,
        });
      }
    }

    // --- 2. Our database ---

    await Members.updateOne(
      { _id: member.id },
      { email: newEmail, $unset: { pending_email: 1 } }
    );

    // --- 3. Mailchimp (logs, never throws) ---

    await changeContactEmail(oldEmail, newEmail);

    return res.status(200).json({ email: newEmail });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Confirm email failed:", (error as Error).message);
    return res.status(500).json({
      message:
        "Sorry, we couldn't change your email - please try the link again",
    });
  }
}
