import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { createCheckin, VENUE_SLUG } from "@/src/lib/checkins";
import { applyCors } from "@/src/lib/cors";
import { CheckinPayment } from "@/src/lib/models/checkin";
import Members, { TopUp } from "@/src/lib/models/member";
import { deskPricesFor } from "@/src/lib/stripe/flexiProducts";

// A cash or card (iZettle) payment at the desk buys a pack of this many
const SESSIONS_PER_PACK = 10;

// The three buttons in the app's payment drawer
const PAYMENTS: CheckinPayment[] = ["cash", "card", "pay_later"];

// What the app gets back (mirrored in the app's scan.tsx):
//   paid               - cash/card recorded, pack added, checked in
//   pay_later          - checked in on credit, balance went down by 1
//   already_checked_in - already here at this rehearsal, nothing recorded
//   not_found          - no member with that email
export type RecordPaymentResponse = {
  status: "paid" | "pay_later" | "already_checked_in" | "not_found";
  first_name?: string;
  last_name?: string;
  // Negative when they owe sessions after paying later
  flexi_sessions?: number;
  // Pounds taken at the desk ("paid" only), e.g. card 95 / cash 90
  amount?: number;
};

// Called from the app when a GA scans someone who isn't paid up and picks an
// option in the payment drawer. Checks them in either way:
//   cash / card  - adds a pack of 10 sessions, then uses 1 for tonight
//   pay_later    - uses 1 session anyway, so the balance can go negative
//                  (e.g. -1, and their next pack of 10 leaves them with 9)
// POST { email, venue, payment }
export default async function recordPayment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Check the request ---

  const {
    email: rawEmail,
    venue,
    payment,
  } = req.body as { email?: string; venue?: string; payment?: string };
  if (!rawEmail || typeof rawEmail !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }
  if (typeof venue !== "string" || !VENUE_SLUG.test(venue)) {
    return res.status(400).json({ message: "Venue is required" });
  }
  if (!PAYMENTS.includes(payment as CheckinPayment)) {
    return res
      .status(400)
      .json({ message: "Payment must be cash, card or pay_later" });
  }
  // Emails are stored lower case
  const email = rawEmail.toLowerCase().trim();
  const method = payment as CheckinPayment;

  // Only GAs can record payments (sends 401/403 itself if not)
  const ga = await requireGA(req, res);
  if (!ga) return res;

  // --- Find the member ---

  const member = await Members.findOne({ email });
  if (!member) {
    return res
      .status(200)
      .json({ status: "not_found" } as RecordPaymentResponse);
  }

  const name = { first_name: member.first_name, last_name: member.last_name };
  // Cash/card buy a pack of 10; pay later buys nothing
  const sessionsAdded = method === "pay_later" ? 0 : SESSIONS_PER_PACK;
  // What they paid for the pack (from the env vars - see
  // lib/stripe/flexiProducts.ts). Cash is cheaper, passing on the card fee:
  //   full price - card £95, cash £90;  concession - card £85, cash £80
  // Nothing for pay later.
  const prices = deskPricesFor(member);
  let amount: number | undefined;
  if (method === "cash") amount = prices.cash;
  if (method === "card") amount = prices.card;

  // --- Check them in ---

  // Done first - if they're already here, nothing is charged or recorded
  // (e.g. the drawer was open on two GAs' phones for the same person).
  // The check-in stores how they paid, which is what Who's here shows and
  // what the takings are reconciled from.
  const checkin = await createCheckin(member, venue, ga.id, {
    payment: method,
    sessions_added: sessionsAdded,
    flexi_deducted: true,
    amount,
  });
  if (!checkin) {
    return res.status(200).json({
      status: "already_checked_in",
      ...name,
      flexi_sessions: member.flexi_sessions || 0,
    });
  }

  // --- Update their balance ---

  // Add the pack (if paid) and use tonight's session in one atomic update.
  // No floor at 0, so "pay later" can take the balance negative.
  // Worked examples:
  //   balance  0, cash      ->  0 + 10 - 1 =  9
  //   balance -1, card      -> -1 + 10 - 1 =  8
  //   balance  0, pay later ->  0 +  0 - 1 = -1
  const updated = await Members.findByIdAndUpdate(
    member.id,
    {
      $inc: { flexi_sessions: sessionsAdded - 1 },
      // Same shape as online top-ups (see api/stripe/webhooks.ts), plus how
      // it was paid and the check-in it belongs to (so undo can remove it)
      ...(sessionsAdded
        ? {
            $push: {
              topUpDate: {
                type: member.flexi_type || "Flexi",
                date: new Date(),
                method,
                // Desk prices are in pounds
                amount_pence: (amount || 0) * 100,
                checkin_id: checkin.id,
              } as TopUp,
            },
          }
        : {}),
    },
    { new: true }
  );

  return res.status(200).json({
    status: method === "pay_later" ? "pay_later" : "paid",
    ...name,
    flexi_sessions: updated?.flexi_sessions ?? 0,
    amount,
  } as RecordPaymentResponse);
}
