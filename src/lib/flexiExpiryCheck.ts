import {
  flexiExpiresAt,
  FlexiExpiryNotice,
  flexiExpiryNotice,
  parseDay,
} from "@/src/lib/flexiExpiry";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";

/* Expires a Flexi member's sessions if they haven't checked in for 6 months
(the rules are in lib/flexiExpiry.ts). Server only - the caller must have
connected to the database.

Called whenever it matters: when they open the app (get-profile), log in to
the website (the dashboard), and when they're scanned at the door
(check-in-member) - so there's no scheduled job to run, and nobody slips
through with an old card.

Returns the warning notice if their sessions are due to expire soon (or
null), and changes `member` in place if they've just expired, so the caller
carries on with the up-to-date member. */

type FlexiMember = {
  id: string;
  membership_type?: string;
  flexi_sessions?: number;
  date_joined?: string;
};

export async function checkFlexiExpiry(
  member: FlexiMember,
  now = new Date()
): Promise<FlexiExpiryNotice | null> {
  // Only members who are on Flexi and actually joined (paid) - not a
  // sign-up that never finished paying
  if (member.membership_type !== "flexi" || !member.date_joined) return null;

  const startsFrom = parseDay(process.env.FLEXI_EXPIRY_FROM);
  if (!startsFrom) return null;

  // Their latest check-in ("YYYY-MM-DD" sorts by date)
  const last = await Checkins.findOne({ member_id: member.id })
    .sort({ session_date: -1 })
    .select("session_date")
    .lean<{ session_date: string }>();
  const expiresAt = flexiExpiresAt(
    parseDay(last?.session_date),
    parseDay(member.date_joined),
    startsFrom
  );
  if (!expiresAt) return null;

  if (now < expiresAt) return flexiExpiryNotice(expiresAt, now);

  // --- Expired: sessions gone (and any owed written off) ---

  const expired = {
    at: now,
    sessions_removed: member.flexi_sessions || 0,
    last_check_in: last?.session_date || null,
  };
  // Only if still on Flexi, so two requests at once can't do it twice
  await Members.updateOne(
    { _id: member.id, membership_type: "flexi" },
    {
      membership_type: "flexi_expired",
      flexi_sessions: 0,
      flexi_expired: expired,
    }
  );
  Object.assign(member, {
    membership_type: "flexi_expired",
    flexi_sessions: 0,
    flexi_expired: expired,
  });
  return null;
}
