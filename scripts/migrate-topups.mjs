/* eslint-disable no-console */
// Converts members' top-up history (topUpDate) from the old shape to the
// current one (see TopUp in src/lib/models/member.ts):
//
//   old  { type: "Flexi", date: "14-07-2026" }               text date
//   new  { type: "Flexi", date: 2026-07-14, method: "online" } real date
//
// Old entries without a method were online (Stripe) purchases - desk
// payments always saved one. The amount isn't known for old entries, so it's
// left out. Entries already in the new shape are left alone, so it's safe to
// run more than once.
//
//   npm run migrate:topups            show what would change, touch nothing
//   npm run migrate:topups -- --apply make the changes
//
// Uses MONGO_URI (.env.development.local first, then .env.local) - check
// the database it prints before using --apply.

import mongoose from "mongoose";

const apply = process.argv.includes("--apply");

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

// "14-07-2026" -> 14 July 2026, midday UK-ish (so no timezone can tip it
// into the day before or after). Anything else -> null.
const fromUkText = (text) => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(text));
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, 12));
  return Number.isNaN(date.getTime()) ? null : date;
};

await mongoose.connect(uri);
try {
  const { host, name } = mongoose.connection;
  console.log(`Database: ${host}/${name}${apply ? "" : " (dry run)"}`);
  const members = mongoose.connection.collection("members");

  let membersChanged = 0;
  let entriesChanged = 0;
  const problems = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const member of members.find({
    "topUpDate.0": { $exists: true },
  })) {
    let converted = 0;
    const topUps = member.topUpDate.map((entry) => {
      if (entry.date instanceof Date && entry.method) return entry;
      const date =
        entry.date instanceof Date ? entry.date : fromUkText(entry.date);
      if (!date) {
        problems.push(
          `${member.email}: couldn't read date ${JSON.stringify(entry.date)}`
        );
        return entry;
      }
      converted += 1;
      return { ...entry, date, method: entry.method || "online" };
    });
    if (converted) {
      membersChanged += 1;
      entriesChanged += converted;
      if (apply) {
        // eslint-disable-next-line no-await-in-loop
        await members.updateOne(
          { _id: member._id },
          { $set: { topUpDate: topUps } }
        );
      }
    }
  }

  console.log(
    `${
      apply ? "Updated" : "Would update"
    } ${entriesChanged} top-ups for ${membersChanged} members`
  );
  problems.forEach((problem) => console.log(`  ⚠ ${problem}`));
  if (!apply && entriesChanged)
    console.log("Run with --apply to make the changes");
} finally {
  await mongoose.disconnect();
}
