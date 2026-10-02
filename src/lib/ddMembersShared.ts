// Existing Direct Debit members - the bits the "DD members" admin page (in the
// browser) and the server share. Browser-safe: no database or GoCardless code.

export type InviteStatus = "not_sent" | "sent" | "accepted";

export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
  not_sent: "Not sent",
  sent: "Invite sent",
  accepted: "Account created",
};

// One member as the admin page shows them
export type DDMemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  home_choir: string;
  // Only members whose Direct Debit mandate is active in GoCardless are
  // invited (not ones still being set up, or cancelled)
  can_invite: boolean;
  // GoCardless's mandate status, e.g. "active", "pending_submission"
  mandate_status: string;
  invite_status: InviteStatus;
  invite_sent_at: string | null;
  invite_send_count: number;
  // What their Direct Debit pays for (see planFor), and the amount in pence
  plan: Plan;
  amount: number;
  // Joint membership: the other singer(s) added to this Direct Debit
  other_singers: string[];
  // Extra singer on someone else's Direct Debit: the payer's name
  paid_by_name: string | null;
};

// There are only two monthly prices: single (£30) and the legacy joint
// membership (£50, two singers on one Direct Debit). Anything else is
// flagged for the admin to check.
export type Plan = "single" | "joint" | "other";
export const planFor = (
  amount: number,
  singlePence: number,
  jointPence: number
): Plan => {
  if (amount === singlePence) return "single";
  if (amount === jointPence) return "joint";
  return "other";
};

// What "Import from GoCardless" reports back
export type ImportSummary = {
  created: number;
  updatedExisting: number;
  alreadyImported: number;
  skippedNoEmail: string[];
  // Joint memberships - each needs its second singer adding
  joint: string[];
  // Neither the single nor the joint price - "Name (£35)"
  otherAmount: string[];
  // Mandate not active (e.g. still being set up) - not imported
  mandateNotActive: string[];
  // A second GoCardless customer with an email that's already here
  sharedEmail: string[];
};

// The most invites sent per request. The admin page sends everyone in
// batches of this many, one request after another, so each request stays
// short (Vercel time limits) and the gaps between emails keep under Resend's
// rate limit.
export const MAX_INVITES_PER_REQUEST = 5;

// "£60"
export const pounds = (pence: number) =>
  `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}`;
