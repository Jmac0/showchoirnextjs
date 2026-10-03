import { addMonths, subMonths } from "date-fns";

// Flexi sessions expire after FLEXI_EXPIRY_MONTHS without a check-in - the
// date maths, browser-safe (no database code). The database side - finding
// their last check-in and expiring them - is lib/flexiExpiryCheck.ts.
//
//   last check-in + 6 months   -> sessions expire (set to 0, even if they
//                                 owed some), membership_type "flexi_expired":
//                                 card hidden, can't buy more Flexi, offered
//                                 a Direct Debit instead
//   from 1 month before that   -> they're warned ("expire on ... unless you
//                                 come along before then")
//
// Nothing expires before FLEXI_EXPIRY_FROM (an env var, "YYYY-MM-DD"), so
// members can be told first: someone with no check-in for a year expires on
// that date, not straight away (and is warned the month before). If it isn't
// set, nothing expires at all.

export const FLEXI_EXPIRY_MONTHS = 6;
export const FLEXI_WARNING_MONTHS = 1;

// What the Account page / app shows a Flexi member whose sessions are due to
// expire. ISO date string, so it can be sent as JSON.
export type FlexiExpiryNotice = {
  expires_at: string;
  // True from a month before - show the warning
  in_warning: boolean;
};

// Recorded on the member when their sessions expire, so they can be put
// back if needed
export type FlexiExpired = {
  at: Date | string;
  // How many sessions were taken away (negative if they owed some)
  sessions_removed: number;
  // Their last check-in ("YYYY-MM-DD"), or none
  last_check_in: string | null;
};

// "2026-03-14", "14-03-2026" or "14/03/2026" -> a Date (midday, so no
// timezone tips it into another day), or null
export const parseDay = (text?: string | null): Date | null => {
  const value = String(text || "").trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(+year, +month - 1, +day, 12));
  }
  match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(value);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Date.UTC(+year, +month - 1, +day, 12));
  }
  return null;
};

// When a Flexi member's sessions expire: 6 months after their last check-in
// (or after they joined, if they've never checked in) - but never before the
// start date. Null if there's no start date (expiry switched off).
export const flexiExpiresAt = (
  lastCheckIn: Date | null,
  joined: Date | null,
  startsFrom: Date | null
): Date | null => {
  if (!startsFrom) return null;
  const lastActivity = lastCheckIn || joined;
  if (!lastActivity) return startsFrom;
  const expires = addMonths(lastActivity, FLEXI_EXPIRY_MONTHS);
  return expires > startsFrom ? expires : startsFrom;
};

// The notice to show, given when they expire
export const flexiExpiryNotice = (
  expiresAt: Date,
  now = new Date()
): FlexiExpiryNotice => ({
  expires_at: expiresAt.toISOString(),
  in_warning: now >= subMonths(expiresAt, FLEXI_WARNING_MONTHS),
});
