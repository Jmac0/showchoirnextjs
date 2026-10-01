/* eslint-disable no-console */
// Checks every member's home_choir is one of the choirs in Contentful, and
// lists anyone whose isn't - e.g. "option1"-"option5" from the old sign-up
// form's placeholder dropdown, a blank, a typo, or a choir that's since been
// renamed or removed.
//
//   npm run check:choirs              check only - changes nothing (shows what --fix would do)
//   npm run check:choirs -- --fix     also update option1-option5 to the real choir
//
// It uses the database in MONGO_URI from the .env files. To check the live
// database, give it the connection string for that run:
//   MONGO_URI="mongodb+srv://..." npm run check:choirs
//
// The choir list comes from Contentful (the same list the forms use, see
// src/lib/venues.ts), so new choirs added there are picked up automatically.
// --fix only changes the old placeholder values (see OLD_PLACEHOLDERS) -
// anything else that isn't a choir (blank, typo...) is listed to sort by hand.
// Exits with code 1 if any members still need fixing.

import mongoose from "mongoose";
import { createRequire } from "node:module";

import Members from "../src/lib/models/member.ts";

const require = createRequire(import.meta.url);
const contentful = require("contentful");

const fix = process.argv.slice(2).includes("--fix");

// The old sign-up form's placeholder options, and the choir each one meant
const OLD_PLACEHOLDERS = {
  option1: "Banstead",
  option2: "Leatherhead",
  option3: "Dorking",
  option4: "Cobham",
  option5: "West Byfleet",
};

// Same precedence as `next dev`: .env.development.local wins over .env.local
// (loadEnvFile never overwrites a variable that's already set, so a MONGO_URI
// given on the command line wins over both)
[".env.development.local", ".env.local"].forEach((file) => {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing, fine
  }
});

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}

// --- The current choirs, from Contentful ---

// "Show Choir Banstead" -> "Banstead" (same as choirName in src/lib/venues.ts)
const choirName = (location) => location.replace(/^Show Choir\s+/i, "").trim();

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACEID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});
const { items } = await client.getEntries({ content_type: "venue" });
const choirs = items
  .sort((a, b) => a.fields.order - b.fields.order)
  .map((item) => choirName(item.fields.location));
const isChoir = new Set(choirs);

// Only fix to choirs that still exist in Contentful
Object.entries(OLD_PLACEHOLDERS).forEach(([placeholder, choir]) => {
  if (!isChoir.has(choir)) {
    console.error(
      `"${placeholder}" maps to "${choir}", which isn't in Contentful`
    );
    process.exit(1);
  }
});

console.log(`Choirs in Contentful: ${choirs.join(", ")}`);
// Only show the host, not the username/password in the connection string
console.log(`Database: ${uri.replace(/\/\/[^@]*@/, "//***@")}`);
console.log(fix ? "Mode: FIX (will update option1-5)\n" : "Mode: check only\n");

// Lists members, one per line
const printMembers = (members) =>
  members.forEach((member) => {
    const name = `${member.first_name || ""} ${member.last_name || ""}`.trim();
    const joined = member.date_joined
      ? `joined ${member.date_joined}`
      : "not joined";
    console.log(
      `     ${name.padEnd(24)} ${String(member.email).padEnd(32)} ${
        member.membership_type || ""
      } · ${joined}`
    );
  });

await mongoose.connect(uri);
let stillToFix = 0;
try {
  const members = await Members.find(
    {},
    "first_name last_name email home_choir date_joined membership_type"
  )
    .sort({ home_choir: 1, first_name: 1 })
    .lean();

  // Group members by the home_choir saved for them
  const byChoir = new Map();
  members.forEach((member) => {
    const key = (member.home_choir || "").trim();
    if (!byChoir.has(key)) byChoir.set(key, []);
    byChoir.get(key).push(member);
  });

  // --- Old placeholders: option1-5 -> the real choir ---

  const placeholders = Object.keys(OLD_PLACEHOLDERS).filter((key) =>
    byChoir.has(key)
  );
  if (placeholders.length) {
    console.log(
      fix
        ? "🔧 Fixing old placeholder home choirs:"
        : "⚠️  Old placeholder home choirs (run with --fix to update):"
    );
    // One at a time, so the output shows each change in turn
    // eslint-disable-next-line no-restricted-syntax
    for (const placeholder of placeholders) {
      const choir = OLD_PLACEHOLDERS[placeholder];
      const affected = byChoir.get(placeholder);
      console.log(`\n   "${placeholder}" -> ${choir} - ${affected.length}`);
      printMembers(affected);
      if (fix) {
        // eslint-disable-next-line no-await-in-loop
        const { modifiedCount } = await Members.updateMany(
          { home_choir: placeholder },
          { $set: { home_choir: choir } }
        );
        console.log(`     ✓ updated ${modifiedCount}`);
        // Count them under their real choir in the summary below
        byChoir.set(choir, [...(byChoir.get(choir) || []), ...affected]);
        byChoir.delete(placeholder);
      }
    }
    console.log("");
  }

  // --- Summary ---

  console.log(`${members.length} members\n\n✓ Home choir is a current choir:`);
  choirs.forEach((choir) => {
    console.log(`   ${choir.padEnd(16)} ${(byChoir.get(choir) || []).length}`);
  });

  // Anything still not a current choir (placeholders if not fixing, blanks, typos...)
  const unknown = [...byChoir.keys()].filter((key) => !isChoir.has(key));
  stillToFix = unknown.reduce(
    (total, key) => total + byChoir.get(key).length,
    0
  );
  const others = unknown.filter((key) => !(key in OLD_PLACEHOLDERS));

  if (others.length) {
    console.log("\n⚠️  Home choir isn't a choir - needs sorting out by hand:");
    others.forEach((key) => {
      console.log(
        `\n   ${key ? `"${key}"` : "(blank)"} - ${byChoir.get(key).length}`
      );
      printMembers(byChoir.get(key));
    });
  }

  console.log(
    stillToFix
      ? `\n${stillToFix} member(s) still need a home choir fixed.`
      : "\nAll members have a current home choir. 🎉"
  );
} finally {
  await mongoose.disconnect();
}

process.exit(stillToFix ? 1 : 0);
