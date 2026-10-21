import type { AttendanceEntry } from "@/src/lib/attendance";

// The admin reports' answers, as the report pages receive them (JSON).
// Browser-safe - the server side is lib/reports.ts.

// A choir to pick in the reports: its venue slug (how check-ins store it)
// and name, e.g. { slug: "choir-dorking-surrey", name: "Dorking" }
export type ReportVenue = { slug: string; name: string };

// --- Active members ---

export type MemberCounts = { dd: number; flexi: number; ga: number };

export type ActiveMembersReport = {
  // Everyone whose membership is active right now (isMembershipActive)
  total: number;
  by_type: MemberCounts;
  // Active members by home choir, A-Z ("No choir" if it isn't set)
  by_choir: (MemberCounts & { choir: string; total: number })[];
  // DD members still active only because they're in the grace period after
  // their Direct Debit ended (counted in the total too)
  dd_grace: number;
  // Not active (not in the total): DD ended over DD_GRACE_DAYS ago or never
  // set up, and Flexi sessions expired
  dd_ended: number;
  flexi_expired: number;
};

// --- Attendance on a date ---

export type AttendanceSummary = {
  total: number;
  dd: number;
  flexi: number;
  ga: number;
  tasters: number;
  // Paid at the desk that night, in pounds
  cash: number;
  card: number;
  // Let in to pay later
  pay_later: number;
};

export type AttendanceReport = {
  venue: string;
  session_date: string;
  summary: AttendanceSummary;
  entries: AttendanceEntry[];
};

// --- Flexi sessions used ---

export type PacksBought = { count: number; amount_pence: number };

export type FlexiSessionsReport = {
  from: string;
  to: string;
  // Flexi sessions taken off at check-in, in total and by venue slug
  sessions_used: number;
  by_venue: { venue: string; sessions: number }[];
  // Flexi packs bought in the same dates: online (Stripe) and at the desk
  packs: { online: PacksBought; cash: PacksBought; card: PacksBought };
};

// 12345 -> "£123.45", 9000 -> "£90"
export const formatPence = (pence: number) =>
  `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}`;
