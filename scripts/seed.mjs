/* eslint-disable no-console */
// Seeds the LOCAL database with dummy members from scripts/seed/members.json.
//
//   npm run seed              upsert members by email (safe to re-run)
//   npm run seed -- --reset   empty the members collection first
//   npm run seed -- --dry-run show what would be written, touch nothing
//
// Every member gets SEED_PASSWORD so you can log in as any of them,
// except entries with "_no_password": true.
//
// "_dd_ended_days_ago": 5 gives a Direct Debit member a cancelled Direct
// Debit that stopped that many days before the seed runs - so a member can
// always be inside (or past) the 14-day grace period, whenever you seed
// (see src/lib/directDebit.ts).

import { readFileSync } from "node:fs";

import bcrypt from "bcrypt";
import mongoose from "mongoose";

import Checkins from "../src/lib/models/checkin.ts";
import Members from "../src/lib/models/member.ts";

const SEED_PASSWORD = "password123";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const reset = args.has("--reset");

// Same precedence as `next dev`: .env.development.local wins over .env.local
// (loadEnvFile never overwrites a variable that's already set)
[".env.development.local", ".env.local"].forEach((file) => {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing, fine
  }
});

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set in .env.development.local or .env.local");
  process.exit(1);
}
// never let this run against a hosted database
const { hostname } = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:"));
if (!["127.0.0.1", "localhost"].includes(hostname)) {
  console.error(`Refusing to seed a non-local database (${hostname})`);
  process.exit(1);
}

// A Direct Debit that stopped `days` days ago, as the GoCardless webhook
// records it (src/pages/api/gocardless/webhooks.ts)
function directDebitEnded(days) {
  const at = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [year, month, day] = at.toISOString().slice(0, 10).split("-");
  return {
    active_mandate: false,
    gc_mandate_status: "cancelled",
    direct_debit_cancelled: `${day}/${month}/${year}`,
    direct_debit_ended: {
      at,
      event: "cancelled",
      cause: "mandate_cancelled",
      description: "The mandate was cancelled at your customer's request.",
    },
  };
}

const members = JSON.parse(
  readFileSync(new URL("./seed/members.json", import.meta.url), "utf8"),
).map(
  ({
    _note,
    _no_password: noPassword,
    _dd_ended_days_ago: endedDaysAgo,
    ...member
  }) => ({
    ...member,
    ...(noPassword ? {} : { password: bcrypt.hashSync(SEED_PASSWORD, 8) }),
    ...(endedDaysAgo === undefined ? {} : directDebitEnded(endedDaysAgo)),
  }),
);

if (dryRun) {
  console.table(
    members.map((m) => ({
      email: m.email,
      type: m.membership_type,
      sessions: m.flexi_sessions ?? "",
      active: m.active_member,
      mandate: m.active_mandate ?? "",
      "dd ended": m.direct_debit_ended
        ? m.direct_debit_ended.at.toISOString().slice(0, 10)
        : "",
      role: m.role || "",
      password: m.password ? SEED_PASSWORD : "(none)",
    })),
  );
  console.log(`Dry run: would ${reset ? "reset and " : ""}seed ${uri}`);
  process.exit(0);
}

await mongoose.connect(uri);
try {
  if (reset) {
    const { deletedCount } = await Members.deleteMany({});
    console.log(`Reset: removed ${deletedCount} members`);
  }
  await Promise.all(
    members.map((member) =>
      // Replace the whole record (keeping its _id), so anything left over
      // from testing - e.g. sessions owed after "pay later" - is cleared too
      Members.findOneAndReplace({ email: member.email }, member, {
        upsert: true,
        runValidators: true,
      }),
    ),
  );
  // clear seeded members' check-ins so they can be scanned in again
  const seededIds = await Members.find({
    email: { $in: members.map((m) => m.email) },
  }).distinct("_id");
  const { deletedCount: checkinsRemoved } = await Checkins.deleteMany({
    member_id: { $in: seededIds },
  });
  console.log(`Cleared ${checkinsRemoved} check-ins for seeded members`);
  const total = await Members.countDocuments();
  console.log(`Seeded ${members.length} members into ${uri} (${total} total)`);
  console.log(`Login password for seeded members: ${SEED_PASSWORD}`);
} finally {
  await mongoose.disconnect();
}
