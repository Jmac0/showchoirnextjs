import type { InviteStatus } from "@/src/lib/ddMembersShared";

// Existing Flexi members - the bits the "Flexi members" admin page (in the
// browser) and the server share. Browser-safe: no database or Mailchimp code.

// The Mailchimp tag the admin gives current Flexi members in the Choir
// audience before importing them
export const FLEXI_TAG = "Flexi";

// Sessions a GA or admin can enter from the paper records - negative if they
// owe some
export const MIN_CONFIRMED_SESSIONS = -20;
export const MAX_CONFIRMED_SESSIONS = 100;

export const isValidSessionCount = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= MIN_CONFIRMED_SESSIONS &&
  (value as number) <= MAX_CONFIRMED_SESSIONS;

// One member as the admin page shows them
export type FlexiMemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  home_choir: string;
  // Not until a GA (or admin) has entered them from the paper records
  sessions_confirmed: boolean;
  flexi_sessions: number;
  // Who confirmed them and when, e.g. "Sue Smith, 12 Nov 2026"
  confirmed_note: string | null;
  can_invite: boolean;
  invite_status: InviteStatus;
  invite_sent_at: string | null;
  invite_send_count: number;
};

// What "Import from Mailchimp" reports back
export type FlexiImportSummary = {
  created: number;
  // Already imported earlier - left as they are
  alreadyImported: number;
  // Already a member some other way (joined on the website, Direct Debit...)
  // - never changed: "Name (email)"
  alreadyMember: string[];
  // Email bounced in Mailchimp ("cleaned") - can't be invited
  badEmail: string[];
  // Whether the Choir audience has the tag (if not, nothing was imported)
  tagFound: boolean;
};
