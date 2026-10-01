/* eslint-disable no-console */
// `npm run dev`: starts the Next.js dev server and, alongside it, the Stripe
// CLI forwarding test-mode payment webhooks to it, so Flexi purchases add
// sessions locally (see src/pages/api/stripe/webhooks.ts).
//
//   npm run dev         Next.js + Stripe listener
//   npm run dev:next    Next.js only
//
// The listener is skipped (Next.js still starts) if the Stripe CLI isn't
// installed or STRIPE_SECRET isn't a test key. It logs in with STRIPE_SECRET
// from the env files, so it doesn't depend on `stripe login`, which expires.

import { spawn, spawnSync } from "node:child_process";

// Same precedence as `next dev`: .env.development.local wins over .env.local
// (loadEnvFile never overwrites a variable that's already set)
[".env.development.local", ".env.local"].forEach((file) => {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing, fine
  }
});

// Any extra arguments go to next dev, e.g. `npm run dev -- -p 3001`
const nextArgs = process.argv.slice(2);

// Forward webhooks to whichever port Next.js is using (default 3000)
const portFlag = nextArgs.findIndex((arg) => arg === "-p" || arg === "--port");
const port =
  (portFlag >= 0 && nextArgs[portFlag + 1]) || process.env.PORT || 3000;
const WEBHOOK_URL = `localhost:${port}/api/stripe/webhooks`;
// The only event the webhook uses
const EVENTS = "payment_intent.succeeded";

// (`npm run` puts node_modules/.bin on the PATH, so `next` is found directly)
const next = spawn("next", ["dev", ...nextArgs], { stdio: "inherit" });

// --- Start the Stripe listener, if we can ---

function startStripeListener() {
  const key = process.env.STRIPE_SECRET || "";

  if (spawnSync("stripe", ["version"]).error) {
    console.log(
      "[stripe] Stripe CLI not installed - webhooks won't reach this dev server.\n" +
        "[stripe] Install it with: brew install stripe/stripe-cli/stripe"
    );
    return null;
  }
  // Never forward live payments to a dev machine
  if (!key.startsWith("sk_test_")) {
    console.log("[stripe] STRIPE_SECRET isn't a test key - not listening.");
    return null;
  }

  // The key goes in the environment rather than on the command line, so it
  // doesn't show up in the process list.
  const env = { ...process.env, STRIPE_API_KEY: key };

  // The webhook only accepts events signed with STRIPE_ENDPOINT_SECRET -
  // warn if it doesn't match the listener's signing secret.
  const signingSecret = spawnSync("stripe", ["listen", "--print-secret"], {
    env,
    encoding: "utf8",
  }).stdout?.trim();
  if (signingSecret && signingSecret !== process.env.STRIPE_ENDPOINT_SECRET) {
    console.log(
      "[stripe] ⚠️  STRIPE_ENDPOINT_SECRET doesn't match the listener, so " +
        "payments won't add sessions.\n" +
        `[stripe]    Put this in .env.development.local: STRIPE_ENDPOINT_SECRET=${signingSecret}`
    );
  }

  const listener = spawn(
    "stripe",
    ["listen", "--events", EVENTS, "--forward-to", WEBHOOK_URL],
    { env, stdio: ["ignore", "pipe", "pipe"] }
  );

  // Prefix the listener's output so it's easy to tell apart from Next.js
  const prefix = (chunk) =>
    chunk
      .toString()
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line) => console.log(`[stripe] ${line}`));
  listener.stdout.on("data", prefix);
  listener.stderr.on("data", prefix);
  listener.on("exit", (code) => {
    if (code) console.log(`[stripe] listener stopped (exit code ${code})`);
  });

  return listener;
}

const listener = startStripeListener();

// --- Stop both together ---

// When Next.js stops (Ctrl+C or a crash), stop the listener too.
next.on("exit", (code) => {
  listener?.kill();
  process.exit(code ?? 0);
});
// Ctrl+C is sent to Next.js and the listener directly, so there's nothing to
// do here except not exit before Next.js has shut down (the handler above
// exits once it has).
const waitForNextToExit = () => undefined;
process.on("SIGINT", waitForNextToExit);
process.on("SIGTERM", () => {
  listener?.kill();
  next.kill();
});
