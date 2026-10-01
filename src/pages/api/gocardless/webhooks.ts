import { format } from "date-fns";
import { Event, SubscriptionIntervalUnit } from "gocardless-nodejs/types/Types";
import { InvalidSignatureError, parse } from "gocardless-nodejs/webhooks";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { sendWelcomeEmail } from "@/src/lib/email/sendWelcomeEmail";
import { goCardlessClient, monthlyAmountPence } from "@/src/lib/gocardless";
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
  mandates cancelled/failed/expired  -> mark their Direct Debit as not active

The reply tells GoCardless whether we've dealt with it:
  200 - done (or nothing to do), don't send it again
  498 - not really from GoCardless (bad signature), ignored
  500 - something went wrong, so GoCardless retries later
We only reply once everything is saved - on a serverless host (Vercel) the
function stops as soon as it replies, so replying first would lose the work.

The webhook endpoint (and its secret, GO_CARDLESS_WEBHOOK_SECRET) is set up
in the GoCardless dashboard: https://<site>/api/gocardless/webhooks */

// "dd/MM/yyyy" - the date format the old Express app saved
const today = () => format(new Date(), "dd/MM/yyyy");

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

  await Members.updateOne(
    { _id: member.id },
    {
      active_mandate: true,
      active_member: true,
      membership_type: "DD",
      go_cardless_id: customer.id,
      mandate: event.links?.mandate_request_mandate || member.mandate || "",
      direct_debit_started: today(),
      direct_debit_cancelled: "",
      ...(isNewMember ? { date_joined: today() } : {}),
    }
  );

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

// Their Direct Debit has stopped (cancelled, failed at the bank, or expired)
async function handleMandateEnded(event: Event) {
  const mandateId = event.links?.mandate;
  if (!mandateId) return;
  const mandate = await goCardlessClient().mandates.find(mandateId);
  const customerId = mandate.links?.customer;
  if (!customerId) return;
  const { email } = await memberForCustomer(customerId);

  await Members.updateOne(
    { email },
    {
      active_mandate: false,
      mandate: "",
      go_cardless_id: "",
      direct_debit_cancelled: today(),
    }
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
    return res.status(405).end();
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
