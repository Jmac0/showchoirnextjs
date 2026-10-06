import { format } from "date-fns";
import {
  Event,
  SubscriptionIntervalUnit,
  SubscriptionStatus,
} from "gocardless-nodejs/types/Types";
import { InvalidSignatureError, parse } from "gocardless-nodejs/webhooks";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { DirectDebitEnded } from "@/src/lib/directDebit";
import { sendDirectDebitEndedEmail } from "@/src/lib/email/sendDirectDebitEndedEmail";
import { sendWelcomeEmail } from "@/src/lib/email/sendWelcomeEmail";
import { goCardlessClient, monthlyAmountPence } from "@/src/lib/gocardless";
import { memberJoined } from "@/src/lib/memberAudience";
import GoCardlessEventLog from "@/src/lib/models/goCardlessEventLog";
import Members from "@/src/lib/models/member";

// Next.js mustn't parse the body - the signature check needs it exactly as sent
export const config = {
  api: {
    bodyParser: false,
  },
};

/* Called by GoCardless when something happens to a monthly member's Direct
Debit (moved here from the old Express app):

  billing_requests fulfilled         they've completed the GoCardless form
                                     -> mark them active (and email a new
                                        member the link to create an account)
  mandates created                   -> start their monthly subscription
  mandates cancelled/failed/expired  -> their Direct Debit has stopped: mark
  subscriptions cancelled/finished      it not active, record when and why,
                                        and email the admin. Their membership
                                        stays active for a grace period (see
                                        lib/directDebit.ts)

The reply tells GoCardless whether we've dealt with it:
  200 - done (or nothing to do), don't send it again
  498 - not really from GoCardless (bad signature), ignored
  500 - something went wrong, so GoCardless retries later
We only reply once everything is saved - on a serverless host (Vercel) the
function stops as soon as it replies, so replying first would lose the work.

The webhook endpoint (and its secret, GO_CARDLESS_WEBHOOK_SECRET) is set up
in the GoCardless dashboard: https://<site>/api/gocardless/webhooks */

// "dd/MM/yyyy" - the date format the old Express app saved
const today = (date = new Date()) => format(date, "dd/MM/yyyy");

// The member a GoCardless customer belongs to, found by email
async function memberForCustomer(customerId: string) {
  const customer = await goCardlessClient().customers.find(customerId);
  const email = String(customer.email || "")
    .toLowerCase()
    .trim();
  return { customer, email };
}

// --- What each event does ---

// They've completed the GoCardless Direct Debit form
async function handleFulfilled(event: Event) {
  const customerId = event.links?.customer;
  if (!customerId) return;
  const { customer, email } = await memberForCustomer(customerId);

  const member = await Members.findOne({ email }).select("+password");
  if (!member) {
    // They set up a Direct Debit but we can't find them - sort out by hand
    // eslint-disable-next-line no-console
    console.error(`💥 GoCardless customer ${customerId} (${email}) not found`);
    return;
  }
  // First time (not someone re-doing their Direct Debit)
  const isNewMember = !member.date_joined;

  // Their Direct Debit details - also for anyone setting one up again after
  // theirs stopped (clears the "ended" record, so no more notice)
  const directDebit = {
    active_mandate: true,
    go_cardless_id: customer.id,
    mandate: event.links?.mandate_request_mandate || member.mandate || "",
    gc_mandate_status: "active",
    direct_debit_started: today(),
    direct_debit_cancelled: "",
    $unset: { direct_debit_ended: 1 },
  };
  await Members.updateOne(
    { _id: member.id },
    {
      ...directDebit,
      active_member: true,
      membership_type: "DD",
      ...(isNewMember ? { date_joined: today() } : {}),
    }
  );
  // Extra singers on their Direct Debit (joint membership) move to the new one
  await Members.updateMany({ paid_by_member: member.id }, directDebit);

  // Their membership has started: Mailchimp Prospects -> Choir audience,
  // for them and any extra singers (skipped if Mailchimp isn't set up)
  const extraSingers = await Members.find({ paid_by_member: member.id });
  // eslint-disable-next-line no-restricted-syntax
  for (const singer of [member, ...extraSingers]) {
    // eslint-disable-next-line no-await-in-loop
    await memberJoined(singer);
  }

  // Email a new member the link to create their account (not if they already
  // have a password). A failed email doesn't fail the webhook -
  // sendWelcomeEmail tells the admin instead.
  if (isNewMember && !member.password) {
    try {
      await sendWelcomeEmail(member);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `💥 Welcome email to ${email} failed:`,
        (error as Error).message
      );
    }
  }
}

// A mandate has been set up - start the monthly subscription against it
async function handleMandateCreated(event: Event) {
  const mandateId = event.links?.mandate;
  if (!mandateId) return;
  await goCardlessClient().subscriptions.create(
    {
      amount: monthlyAmountPence(),
      currency: "GBP",
      name: "Show Choir monthly membership",
      interval_unit: SubscriptionIntervalUnit.Monthly,
      day_of_month: "1",
      metadata: { order_no: "Show_Choir_single_subscription" },
      links: { mandate: mandateId },
    },
    // GoCardless won't create a second subscription for the same event, so
    // a retried webhook can't charge them twice
    `subscription-${event.id}`
  );
}

// What GoCardless says happened, from the event
const endedFrom = (event: Event, what: string): DirectDebitEnded => ({
  at: event.created_at ? new Date(event.created_at) : new Date(),
  event: what,
  cause: event.details?.cause || "",
  description: event.details?.description || "",
});

// A Direct Debit has stopped: everyone on it (the payer, found by their
// GoCardless email, and any extra singers it pays for, linked by mandate) is
// marked as not having an active Direct Debit, with when and why - their
// membership stays active for the grace period. The admin is emailed.
// Their GoCardless ids are kept, so the history stays linked.
async function endDirectDebit(mandateId: string, ended: DirectDebitEnded) {
  const mandate = await goCardlessClient().mandates.find(mandateId);
  const customerId = mandate.links?.customer;
  const { email } = customerId
    ? await memberForCustomer(customerId)
    : { email: "" };

  const onThisDirectDebit = {
    $or: [{ mandate: mandateId }, ...(email ? [{ email }] : [])],
    // Only ones still active - if the subscription and then the mandate are
    // both cancelled, the first one counts (so the grace period doesn't
    // restart, and the admin isn't emailed twice)
    active_mandate: true,
  };
  const members = await Members.find(onThisDirectDebit);
  if (members.length === 0) return;

  await Members.updateMany(onThisDirectDebit, {
    active_mandate: false,
    gc_mandate_status: ended.event,
    direct_debit_cancelled: today(new Date(ended.at)),
    direct_debit_ended: ended,
  });

  // A failed email doesn't fail the webhook (the member is already updated)
  try {
    await sendDirectDebitEndedEmail(members, ended);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "💥 Direct Debit ended email failed:",
      (error as Error).message
    );
  }
}

// Their mandate has stopped (cancelled, failed at the bank, or expired)
async function handleMandateEnded(event: Event) {
  const mandateId = event.links?.mandate;
  if (!mandateId) return;
  await endDirectDebit(mandateId, endedFrom(event, event.action || "ended"));
}

// Their monthly subscription has been cancelled (or finished) - the mandate
// may still be active, but they're no longer paying, so it counts as their
// Direct Debit stopping. Unless another subscription on the same mandate is
// still active (e.g. it was replaced by a new one).
async function handleSubscriptionEnded(event: Event) {
  const subscriptionId = event.links?.subscription;
  if (!subscriptionId) return;
  const client = goCardlessClient();
  const subscription = await client.subscriptions.find(subscriptionId);
  const mandateId = subscription.links?.mandate;
  if (!mandateId) return;
  const stillPaying = await client.subscriptions.list({
    mandate: mandateId,
    status: [SubscriptionStatus.Active],
  });
  if (stillPaying.subscriptions?.length) return;
  await endDirectDebit(
    mandateId,
    endedFrom(event, `subscription_${event.action || "ended"}`)
  );
}

// Which handler (if any) an event needs
function handlerFor(event: Event) {
  const { resource_type: resource, action } = event;
  if (resource === "billing_requests" && action === "fulfilled") {
    return handleFulfilled;
  }
  if (resource === "mandates" && action === "created") {
    return handleMandateCreated;
  }
  if (
    resource === "mandates" &&
    ["cancelled", "failed", "expired"].includes(action || "")
  ) {
    return handleMandateEnded;
  }
  if (
    resource === "subscriptions" &&
    ["cancelled", "finished"].includes(action || "")
  ) {
    return handleSubscriptionEnded;
  }
  return null;
}

// Deals with one event, once - skipping events we don't need, and ones we've
// already dealt with (GoCardless resent them)
async function processEvent(event: Event) {
  const handler = handlerFor(event);
  if (!handler || !event.id) return;
  if (await GoCardlessEventLog.exists({ event_id: event.id })) return;

  await handler(event);
  // Logged after it's done, so a failure part-way is retried
  await GoCardlessEventLog.create({ event_id: event.id });
}

const handleWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return undefined;
  }

  // --- Check it really came from GoCardless ---

  let events: Event[];
  try {
    const body = await buffer(req);
    events = parse(
      body,
      process.env.GO_CARDLESS_WEBHOOK_SECRET as string,
      req.headers["webhook-signature"] as string
    );
  } catch (error) {
    // GoCardless's docs ask for a 498 when the signature is wrong
    if (error instanceof InvalidSignatureError) {
      return res.status(498).json({ message: "Invalid signature" });
    }
    return res.status(400).json({ message: "Invalid webhook" });
  }

  // --- Deal with each event, in order ---

  try {
    await dbConnect();

    // One at a time and in order - e.g. a mandate is set up before it's
    // cancelled
    // eslint-disable-next-line no-restricted-syntax
    for (const event of events) {
      // eslint-disable-next-line no-await-in-loop
      await processEvent(event);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    // Database down, GoCardless API error etc - GoCardless retries later
    // eslint-disable-next-line no-console
    console.error("💥 GoCardless webhook failed:", (error as Error).message);
    return res.status(500).json({ message: "Webhook handler failed" });
  }
};

export default handleWebhook;
