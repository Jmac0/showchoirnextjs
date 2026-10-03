// Whether a Direct Debit member's membership is active - including the grace
// period after their Direct Debit ends. Browser-safe (no database code), so
// the server, the Account page and the tests share it.
//
// `active_mandate` on a member says whether their Direct Debit is active in
// GoCardless right now. When it ends (cancelled, failed, expired, or the
// subscription cancelled), the GoCardless webhook turns that off and records
// when and why in `direct_debit_ended` (api/gocardless/webhooks.ts). The
// MEMBERSHIP then stays active for a grace period, so a member isn't turned
// away at the door straight away and has time to set up a new Direct Debit:
//
//   Direct Debit active                    -> active
//   ended less than GRACE_DAYS ago         -> active (grace period)
//   ended longer ago / never set up        -> not active
//
// Worked out each time it's needed (not by a scheduled job switching people
// off), so it can't get stuck if a job fails to run.

export const DD_GRACE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

// Recorded by the webhook when a Direct Debit stops
export type DirectDebitEnded = {
  // When it happened (GoCardless's time for the event)
  at: Date | string;
  // What happened: "cancelled", "failed", "expired" (the mandate), or
  // "subscription_cancelled" / "subscription_finished"
  event: string;
  // GoCardless's reason code and description, e.g. "bank_account_closed",
  // "The customer's bank account was closed"
  cause?: string;
  description?: string;
};

// What members are told on the Account page / app home screen, and what the
// admin page shows. Plain strings (ISO dates) so it can be sent as JSON.
export type DirectDebitNotice = {
  ended_at: string;
  grace_ends_at: string;
  in_grace_period: boolean;
  // e.g. "cancelled", "subscription cancelled"
  what_happened: string;
  reason: string;
};

type MemberLike = {
  active_mandate?: boolean;
  direct_debit_ended?: DirectDebitEnded | null;
};

// When the grace period ends (or ended), or null if their Direct Debit
// hasn't ended
export const graceEndsAt = (member: MemberLike): Date | null => {
  const at = member.direct_debit_ended?.at;
  if (!at) return null;
  const ended = new Date(at);
  if (Number.isNaN(ended.getTime())) return null;
  return new Date(ended.getTime() + DD_GRACE_DAYS * DAY_MS);
};

// True while their Direct Debit has ended but the grace period hasn't
export const isInGracePeriod = (member: MemberLike, now = new Date()) => {
  if (member.active_mandate) return false;
  const ends = graceEndsAt(member);
  return !!ends && now < ends;
};

// The one check for "is this Direct Debit membership active?" - use it
// everywhere instead of reading active_mandate directly (check-in, the desk
// search, the profile, the Account page)
export const hasActiveDirectDebit = (member: MemberLike, now = new Date()) =>
  !!member.active_mandate || isInGracePeriod(member, now);

// The notice for a member whose Direct Debit has ended (grace period or
// after), or null if there's nothing to tell them
export const directDebitNotice = (
  member: MemberLike,
  now = new Date()
): DirectDebitNotice | null => {
  const ended = member.direct_debit_ended;
  const ends = graceEndsAt(member);
  if (member.active_mandate || !ended || !ends) return null;
  return {
    ended_at: new Date(ended.at).toISOString(),
    grace_ends_at: ends.toISOString(),
    in_grace_period: now < ends,
    what_happened: ended.event.replace(/_/g, " "),
    reason: ended.description || ended.cause || "",
  };
};

// Whether to show their membership card (the QR code for check-in) on the
// website and in the app. Hidden for a Direct Debit member whose membership
// isn't active - their Direct Debit stopped over `DD_GRACE_DAYS` ago (or was
// never set up) - instead they're asked to set up a new Direct Debit.
// Flexi members keep theirs (the desk takes payment when they run out), and
// so do GAs.
export const isMembershipCardActive = (
  member: MemberLike & { membership_type?: string; role?: string },
  now = new Date()
) =>
  member.role === "ga" ||
  member.membership_type !== "DD" ||
  hasActiveDirectDebit(member, now);
