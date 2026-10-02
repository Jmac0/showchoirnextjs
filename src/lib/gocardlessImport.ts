import { format } from "date-fns";
import { GoCardlessClient } from "gocardless-nodejs/client";
import {
  Customer,
  Mandate,
  SubscriptionStatus,
} from "gocardless-nodejs/types/Types";

import { ImportSummary, planFor, pounds } from "@/src/lib/ddMembersShared";
import {
  goCardlessClient,
  jointAmountPence,
  monthlyAmountPence,
} from "@/src/lib/gocardless";
import Members from "@/src/lib/models/member";

/* Brings existing monthly members over from GoCardless (server only).

Members who were paying by Direct Debit before the website had accounts have
a GoCardless subscription but no member record. This reads every ACTIVE
subscription (with its mandate and customer) and creates a member for each
customer, already active - so check-in and the GoCardless webhooks work for
them straight away. They then get an invite email to finish their account
(home choir, password...) - see the "DD members" admin page.

- Read only on GoCardless: nothing is created or changed there.
- Safe to run again: anyone already imported (same GoCardless customer) is
  skipped, so it only adds new ones.
- Never overwrites an existing member with the same email (e.g. someone who
  signed up on the website) - it just links their Direct Debit if missing.
- Customers without an email can't be invited, so they're listed instead.
- Only customers whose mandate is ACTIVE are imported - ones still being set
  up (or suspended etc.) are skipped and listed, and picked up by a later
  import once active. Importing again also refreshes the saved mandate
  status of everyone already imported.
- Prices: £30 single, or the legacy £50 joint membership (two singers - the
  admin adds the second). Any other amount is listed to check.
- Two GoCardless customers with the same email (e.g. someone paying
  separately for two singers): the first is imported, the second's amount is
  added to it, and they're listed - the admin adds the other singer from the
  member's card.

The caller must have connected to the database. */

// "dd/MM/yyyy" - the date format members are saved with (as the webhook)
const ukDate = (iso?: string) =>
  format(iso ? new Date(iso) : new Date(), "dd/MM/yyyy");

const fullName = (customer: Customer) =>
  [customer.given_name, customer.family_name].filter(Boolean).join(" ") ||
  customer.id ||
  "?";

export async function importFromGoCardless(
  client: GoCardlessClient = goCardlessClient()
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    created: 0,
    updatedExisting: 0,
    alreadyImported: 0,
    skippedNoEmail: [],
    joint: [],
    otherAmount: [],
    mandateNotActive: [],
    sharedEmail: [],
  };
  const single = Number(monthlyAmountPence());
  const joint = jointAmountPence();

  // Notes the price for the summary (joint / unusual)
  const notePrice = (name: string, amount: number) => {
    const plan = planFor(amount, single, joint);
    if (plan === "joint") summary.joint.push(name);
    if (plan === "other")
      summary.otherAmount.push(`${name} (${pounds(amount)})`);
  };

  // --- Read everything from GoCardless (a few paged lists, not one call
  // per member) ---

  const mandates = new Map<string, Mandate>();
  // eslint-disable-next-line no-restricted-syntax
  for await (const mandate of client.mandates.all({})) {
    if (mandate.id) mandates.set(mandate.id, mandate);
  }
  const customers = new Map<string, Customer>();
  // eslint-disable-next-line no-restricted-syntax
  for await (const customer of client.customers.all({})) {
    if (customer.id) customers.set(customer.id, customer);
  }

  // Each customer's active subscription(s) - normally just one
  const subscriptionsByCustomer = new Map<
    string,
    { mandateId: string; amount: number }
  >();
  // eslint-disable-next-line no-restricted-syntax
  for await (const subscription of client.subscriptions.all({
    status: [SubscriptionStatus.Active],
  })) {
    const mandateId = subscription.links?.mandate || "";
    const customerId = mandates.get(mandateId)?.links?.customer;
    // eslint-disable-next-line no-continue
    if (!customerId) continue;
    const existing = subscriptionsByCustomer.get(customerId);
    subscriptionsByCustomer.set(customerId, {
      mandateId,
      // Two subscriptions on one customer: add them up
      amount: (existing?.amount || 0) + Number(subscription.amount || 0),
    });
  }

  // --- One member per paying customer ---

  // eslint-disable-next-line no-restricted-syntax
  for (const [customerId, { mandateId, amount }] of Array.from(
    subscriptionsByCustomer
  )) {
    const customer = customers.get(customerId);
    // eslint-disable-next-line no-continue
    if (!customer) continue;
    const name = fullName(customer);
    const email = String(customer.email || "")
      .toLowerCase()
      .trim();
    const mandate = mandates.get(mandateId);
    const mandateStatus = String(mandate?.status || "");

    // eslint-disable-next-line no-await-in-loop
    if (await Members.exists({ go_cardless_id: customerId })) {
      // Already brought over - just refresh their mandate status (and any
      // extra singers on the same Direct Debit)
      // eslint-disable-next-line no-await-in-loop
      await Members.updateMany(
        {
          go_cardless_id: customerId,
          $or: [
            { imported_from_gocardless: true },
            { paid_by_member: { $exists: true, $ne: "" } },
          ],
        },
        { gc_mandate_status: mandateStatus }
      );
      summary.alreadyImported += 1;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (mandateStatus !== "active") {
      summary.mandateNotActive.push(`${name} (${mandateStatus || "unknown"})`);
      // eslint-disable-next-line no-continue
      continue;
    }
    if (!email) {
      summary.skippedNoEmail.push(name);
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const existing = await Members.findOne({ email });
    if (existing?.go_cardless_id && existing.go_cardless_id !== customerId) {
      // Another GoCardless customer already brought in with this email -
      // keep that link, but count this Direct Debit too
      const total = (existing.gc_subscription_amount || 0) + amount;
      // eslint-disable-next-line no-await-in-loop
      await Members.updateOne(
        { _id: existing.id },
        { gc_subscription_amount: total }
      );
      summary.sharedEmail.push(name);
      // eslint-disable-next-line no-continue
      continue;
    }

    notePrice(name, amount);

    if (existing) {
      // Already a member (e.g. joined on the website) - just make sure their
      // Direct Debit is linked, without touching anything else
      // eslint-disable-next-line no-await-in-loop
      await Members.updateOne(
        { _id: existing.id },
        {
          go_cardless_id: customerId,
          mandate: existing.mandate || mandateId,
          active_mandate: true,
          gc_subscription_amount: amount,
        }
      );
      summary.updatedExisting += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await Members.create({
      first_name: customer.given_name || "",
      last_name: customer.family_name || "",
      email,
      street_address: [customer.address_line1, customer.address_line2]
        .filter(Boolean)
        .join(", "),
      town_city: customer.city || "",
      county: customer.region || "",
      post_code: customer.postal_code || "",
      phone_number: customer.phone_number || "",
      // They choose these when they finish their account
      home_choir: "",
      age_confirm: false,
      consent: false,
      // Already paying (active subscription) - active straight away
      membership_type: "DD",
      active_mandate: true,
      active_member: true,
      go_cardless_id: customerId,
      mandate: mandateId,
      gc_mandate_status: mandateStatus,
      date_joined: ukDate(mandate?.created_at),
      direct_debit_started: ukDate(mandate?.created_at),
      direct_debit_cancelled: "",
      topUpDate: [],
      role: "",
      imported_from_gocardless: true,
      gc_subscription_amount: amount,
      invite: { status: "not_sent", send_count: 0 },
    });
    summary.created += 1;
  }

  return summary;
}
