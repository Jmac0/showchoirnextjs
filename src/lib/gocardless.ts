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
