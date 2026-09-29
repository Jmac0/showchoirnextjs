/* eslint-disable no-console */
// Seeds the LOCAL database with dummy members from scripts/seed/members.json.
//
//   npm run seed              upsert members by email (safe to re-run)
//   npm run seed -- --reset   empty the members collection first
//   npm run seed -- --dry-run show what would be written, touch nothing
//
// Every member gets SEED_PASSWORD so you can log in as any of them,
// except entries with "_no_password": true.

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

const members = JSON.parse(
  readFileSync(new URL("./seed/members.json", import.meta.url), "utf8"),
).map(({ _note, _no_password: noPassword, ...member }) => ({
  ...member,
  ...(noPassword ? {} : { password: bcrypt.hashSync(SEED_PASSWORD, 8) }),
}));

if (dryRun) {
  console.table(
    members.map((m) => ({
      email: m.email,
      type: m.membership_type,
      sessions: m.flexi_sessions ?? "",
      active: m.active_member,
      mandate: m.active_mandate ?? "",
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
      Members.findOneAndUpdate({ email: member.email }, member, {
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
