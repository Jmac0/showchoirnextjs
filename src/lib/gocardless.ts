import { GoCardlessClient } from "gocardless-nodejs/client";
import { Environments } from "gocardless-nodejs/constants";

// GoCardless - monthly Direct Debit membership. Server only (the access
// token must never reach the browser). Used by api/gocardless/mandateflow.ts
// (sign-up) and api/gocardless/webhooks.ts (GoCardless telling us a mandate
// was set up or cancelled).
//
// Settings (.env.local / the server's env):
//   GO_CARDLESS_ACCESS_TOKEN    from the GoCardless dashboard
//   GO_CARDLESS_WEBHOOK_SECRET  the webhook endpoint's secret
//   GO_CARDLESS_ENVIRONMENT     "sandbox" (testing) or "live" (real payments)
//   GO_CARDLESS_MONTHLY_AMOUNT  monthly subscription in pence, e.g. 3000 = £30
//   GO_CARDLESS_JOINT_AMOUNT    legacy joint membership (two singers) in
//                               pence - only existing members, 5000 = £50

// (The library's main export has no TypeScript types, so use its client
// class directly - it's what `require("gocardless-nodejs")(...)` returns.)
export const goCardlessClient = () =>
  new GoCardlessClient(
    process.env.GO_CARDLESS_ACCESS_TOKEN as string,
    process.env.GO_CARDLESS_ENVIRONMENT === "live"
      ? Environments.Live
      : Environments.Sandbox
  );

// Monthly subscription amount in pence (defaults to £30)
export const monthlyAmountPence = () =>
  String(Number(process.env.GO_CARDLESS_MONTHLY_AMOUNT) || 3000);

// Legacy joint membership (two singers, one Direct Debit) in pence (defaults
// to £50). Not offered to new members - used to recognise existing ones.
export const jointAmountPence = () =>
  Number(process.env.GO_CARDLESS_JOINT_AMOUNT) || 5000;

// Where to send someone to set up a Direct Debit: asks GoCardless for a Bacs
// mandate request and its hosted form, with their details filled in, and
// returns the form's address. Used by the monthly sign-up (mandateflow.ts)
// and by "Set up a new Direct Debit" for members whose one stopped
// (restart.ts). GoCardless calls the webhook when they've finished it.
export async function directDebitFormUrl(options: {
  member: {
    first_name: string;
    last_name: string;
    email: string;
    street_address?: string;
    town_city?: string;
    county?: string;
    post_code?: string;
  };
  // Where GoCardless sends them after finishing, or if they back out
  redirectUri: string;
  exitUri: string;
}) {
  const { member, redirectUri, exitUri } = options;
  const client = goCardlessClient();

  // A billing request for a Bacs Direct Debit mandate...
  const billingRequest = await client.billingRequests.create({
    mandate_request: { scheme: "bacs" },
  });
  // ...and the hosted form for it, with their details filled in
  const flow = await client.billingRequestFlows.create({
    lock_currency: true,
    redirect_uri: redirectUri,
    exit_uri: exitUri,
    prefilled_customer: {
      given_name: member.first_name,
      family_name: member.last_name,
      address_line1: member.street_address || "",
      city: member.town_city || "",
      region: member.county || "",
      postal_code: member.post_code || "",
      email: member.email,
    },
    links: { billing_request: billingRequest.id as string },
  });
  return flow.authorisation_url as string;
}
