import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { isMembershipActive } from "@/src/lib/directDebit";
import { checkFlexiExpiry } from "@/src/lib/flexiExpiryCheck";
import { memberLeft } from "@/src/lib/memberAudience";
import Members from "@/src/lib/models/member";

// Several hundred members, a database query each - allow longer than default
export const config = { maxDuration: 60 };

/* Daily housekeeping, run by Vercel Cron (vercel.json, 3am). Memberships
end quietly - 14 days after a Direct Debit stops, or 6 months after a Flexi
member's last check-in - and those are normally noticed when the member next
opens the app, logs in or is scanned. Someone who never comes back would
never be noticed, so once a day:

  1. Flexi members who haven't checked in for 6 months: sessions expire
     (lib/flexiExpiryCheck.ts - nothing before FLEXI_EXPIRY_FROM)
  2. Anyone in the Mailchimp Choir audience whose membership has ended:
     moved back to Prospects (lib/memberAudience.ts - only if Mailchimp
     member syncing is set up)

Safe to run any number of times. Vercel calls it with
"Authorization: Bearer <CRON_SECRET>" - set CRON_SECRET in Vercel (any long
random value) and it's added automatically. To run it by hand:
  curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/daily */
export default async function dailyHousekeeping(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    await dbConnect();

    // --- 1. Expire lapsed Flexi members ---

    const flexiMembers = await Members.find({
      membership_type: "flexi",
      date_joined: { $nin: ["", null] },
    });
    let flexiExpired = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const member of flexiMembers) {
      // eslint-disable-next-line no-await-in-loop
      await checkFlexiExpiry(member);
      if (member.membership_type === "flexi_expired") flexiExpired += 1;
    }

    // --- 2. Ended memberships: Mailchimp Choir -> Prospects ---

    const inChoirAudience = await Members.find({ mailchimp_audience: "choir" });
    const ended = inChoirAudience.filter((m) => !isMembershipActive(m));
    // eslint-disable-next-line no-restricted-syntax
    for (const member of ended) {
      // eslint-disable-next-line no-await-in-loop
      await memberLeft(member);
    }

    return res.status(200).json({
      flexiChecked: flexiMembers.length,
      flexiExpired,
      movedToProspects: ended.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Daily housekeeping failed:", (error as Error).message);
    return res.status(500).json({ message: "Daily housekeeping failed" });
  }
}
