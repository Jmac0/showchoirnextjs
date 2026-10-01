import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { sendWelcomeEmail } from "@/src/lib/email/sendWelcomeEmail";
import Members from "@/src/lib/models/member";

/* Sends a member the welcome email with the link to create their account.

Called by a MongoDB Atlas trigger when a member document is updated (it was
set up for Direct Debit sign-ups, when active_mandate becomes true) - the
body is the trigger's change event, with the member in `fullDocument`.
Flexi sign-ups don't need this: the Stripe webhook sends the email itself
when their first payment arrives.

If EMAIL_TRIGGER_SECRET is set, the request must send the same value in an
"x-trigger-secret" header (set it in the Atlas trigger too), so not just
anyone can make the site send emails. */
export default async function sendCreateNewAccountEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const secret = process.env.EMAIL_TRIGGER_SECRET;
  if (secret && req.headers["x-trigger-secret"] !== secret) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const email = req.body?.fullDocument?.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  await dbConnect();

  // Only email real members
  const member = await Members.findOne({ email });
  if (!member) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const response = await sendWelcomeEmail(member);
    return res.status(200).json(response);
  } catch (err) {
    // sendWelcomeEmail has already told the admin
    const { statusCode, message } = err as {
      statusCode?: number;
      message?: string;
    };
    return res.status(statusCode || 500).json({ message });
  }
}
