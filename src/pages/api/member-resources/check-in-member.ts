import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { createCheckin, isCheckedIn, VENUE_SLUG } from "@/src/lib/checkins";
import { applyCors } from "@/src/lib/cors";
import { hasActiveDirectDebit } from "@/src/lib/directDebit";
import { checkFlexiExpiry } from "@/src/lib/flexiExpiryCheck";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import {
  canBuyFlexi,
  deskPricesFor,
  isConcessionMember,
} from "@/src/lib/stripe/flexiProducts";

export type CheckInStatus =
  | "mandate" // active Direct Debit, nothing deducted
  | "ga" // a GA - free, no payment check and nothing deducted
  | "flexi" // one flexi session deducted
  | "already_checked_in" // already scanned in at this rehearsal, not charged again
  | "no_sessions" // not paid up - the app offers to take payment (record-payment)
  | "not_found";

export type CheckInResponse = {
  status: CheckInStatus;
  first_name?: string;
  last_name?: string;
  membership_type?: string;
  // Can be negative when a member has "paid later" and owes sessions
  flexi_sessions?: number;
  // With "no_sessions" only: what to charge for their pack of 10 at the desk
  // - pack_price by card, cash_price by cash (cheaper, see
  // lib/stripe/flexiProducts.ts) - and whether they're a concession member
  pack_price?: number;
  cash_price?: number;
  concession?: boolean;
  // With no_sessions only: whether they can pay at the desk (Flexi members
  // only - Flexi is being phased out)
  can_buy_flexi?: boolean;
};

// Called from the app when a GA scans a member's QR code at a rehearsal:
// confirms they're a paid-up member, records them as here (see the Checkin
// model) and, for flexi members, uses up one session.
export default async function checkInMember(
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

  const { email: rawEmail, venue } = req.body as {
    email?: string;
    venue?: string;
  };
  if (!rawEmail || typeof rawEmail !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }
  if (typeof venue !== "string" || !VENUE_SLUG.test(venue)) {
    return res.status(400).json({ message: "Venue is required" });
  }
  // Emails are stored lower case
  const email = rawEmail.toLowerCase().trim();

  // Only GAs can check people in (sends 401/403 itself if not)
  const ga = await requireGA(req, res);
  if (!ga) return res;

  // --- Find the member ---

  const member = await Members.findOne({ email });
  if (!member) {
    return res.status(200).json({ status: "not_found" } as CheckInResponse);
  }

  // Flexi: if they haven't checked in for 6 months their sessions expire now
  // (updates `member` - they're then not paid up, and can't buy Flexi)
  await checkFlexiExpiry(member);

  const name = { first_name: member.first_name, last_name: member.last_name };
  // Direct Debit active - or stopped recently and still in its grace period
  // (lib/directDebit.ts)
  const directDebitActive = hasActiveDirectDebit(member);

  // --- Responses used more than once below ---

  const alreadyCheckedIn = () =>
    res.status(200).json({
      status: "already_checked_in",
      ...name,
      // Only flexi members have a session count worth showing (not Direct
      // Debit members, or GAs, who come free)
      ...(directDebitActive || member.role === "ga"
        ? {}
        : { flexi_sessions: member.flexi_sessions || 0 }),
    });

  // Not paid up. Nothing is recorded - the app opens its payment drawer and
  // the GA's choice goes to record-payment, which checks them in. The
  // membership type and balance let the drawer say why ("Owes 2 sessions",
  // "Direct Debit is not active", ...), and the prices are what to charge
  // for 10 sessions at the desk (from the env vars):
  //   full price - card £95, cash £90;  concession - card £85, cash £80
  const noSessions = (flexiSessions: number) => {
    const prices = deskPricesFor(member);
    return res.status(200).json({
      status: "no_sessions",
      ...name,
      membership_type: member.membership_type,
      flexi_sessions: flexiSessions,
      pack_price: prices.card,
      cash_price: prices.cash,
      concession: isConcessionMember(member),
      // Flexi is being phased out - the drawer only offers payment (cash,
      // card, pay later) to Flexi members; others are told to set up a
      // Direct Debit
      can_buy_flexi: canBuyFlexi(member),
    });
  };

  // --- GAs: free - just record them as here ---

  // GAs often sing for free, so there's no payment check and no session is
  // used - whether they check themselves in ("Check myself in" in the app)
  // or another GA scans their card.
  if (member.role === "ga") {
    const checkin = await createCheckin(member, venue, ga.id);
    if (!checkin) return alreadyCheckedIn();
    return res.status(200).json({ status: "ga", ...name });
  }

  // --- Not paid up: no active mandate and no sessions left (0 or owing) ---

  // Checked before recording them, but a repeat scan of someone who used
  // their last session (or paid at the desk) earlier tonight is "already here".
  if (!directDebitActive && !(member.flexi_sessions > 0)) {
    if (await isCheckedIn(member.id, venue)) return alreadyCheckedIn();
    return noSessions(member.flexi_sessions || 0);
  }

  // --- Paid up: record them as here ---

  // null = already checked in, so not charged again.
  const checkin = await createCheckin(member, venue, ga.id);
  if (!checkin) return alreadyCheckedIn();

  // Direct Debit: nothing to deduct, they're in.
  if (directDebitActive) {
    return res.status(200).json({ status: "mandate", ...name });
  }

  // Flexi: deduct one session, only if they still have one (atomic, so two
  // GAs scanning at once can't take the balance below zero).
  const updated = await Members.findOneAndUpdate(
    { _id: member.id, flexi_sessions: { $gt: 0 } },
    { $inc: { flexi_sessions: -1 } },
    { new: true }
  );

  if (!updated) {
    // Their last session went between reading and deducting - undo the
    // check-in and offer payment instead.
    await Checkins.deleteOne({ _id: checkin.id });
    return noSessions(0);
  }

  // Note on the check-in that a session was used, so undo can give it back.
  await Checkins.updateOne({ _id: checkin.id }, { flexi_deducted: true });

  return res.status(200).json({
    status: "flexi",
    ...name,
    flexi_sessions: updated.flexi_sessions,
  });
}
