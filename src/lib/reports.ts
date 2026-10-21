import type { AttendanceEntry } from "@/src/lib/attendance";
import { isInGracePeriod, isMembershipActive } from "@/src/lib/directDebit";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import type {
  ActiveMembersReport,
  AttendanceSummary,
  FlexiSessionsReport,
  MemberCounts,
  PacksBought,
} from "@/src/lib/reportsShared";

/* The admin reports (api/admin/reports/*). Server only; the caller must have
connected to the database. The answer types are in lib/reportsShared.ts. */

type MemberForReport = {
  membership_type?: string;
  role?: string;
  home_choir?: string;
  active_mandate?: boolean;
  direct_debit_ended?: { at: Date | string; event: string } | null;
};

// Which column a member counts in - GAs (who come free) first, whatever
// their membership type. null for anyone else (e.g. a sign-up never finished)
const memberKind = (member: MemberForReport): keyof MemberCounts | null => {
  if (member.role === "ga") return "ga";
  if (member.membership_type === "DD") return "dd";
  if (member.membership_type === "flexi") return "flexi";
  return null;
};

// Counts the members whose membership is active - the same rule as the
// website and app use (isMembershipActive in lib/directDebit.ts)
export function countActiveMembers(
  members: MemberForReport[],
  now = new Date()
): ActiveMembersReport {
  const report: ActiveMembersReport = {
    total: 0,
    by_type: { dd: 0, flexi: 0, ga: 0 },
    by_choir: [],
    dd_grace: 0,
    dd_ended: 0,
    flexi_expired: 0,
  };
  const choirs = new Map<string, ActiveMembersReport["by_choir"][number]>();

  members.forEach((member) => {
    if (member.membership_type === "flexi_expired") {
      report.flexi_expired += 1;
      return;
    }
    const kind = memberKind(member);
    if (!kind) return;
    if (!isMembershipActive(member, now)) {
      report.dd_ended += 1;
      return;
    }
    if (kind === "dd" && isInGracePeriod(member, now)) report.dd_grace += 1;

    report.total += 1;
    report.by_type[kind] += 1;
    const choir = member.home_choir?.trim() || "No choir";
    const row = choirs.get(choir) ?? {
      choir,
      total: 0,
      dd: 0,
      flexi: 0,
      ga: 0,
    };
    row.total += 1;
    row[kind] += 1;
    choirs.set(choir, row);
  });

  report.by_choir = [...choirs.values()].sort((a, b) =>
    a.choir.localeCompare(b.choir, "en", { sensitivity: "base" })
  );
  return report;
}

export async function activeMembersReport() {
  const members = await Members.find(
    {},
    {
      membership_type: 1,
      role: 1,
      home_choir: 1,
      active_mandate: 1,
      direct_debit_ended: 1,
    }
  ).lean<MemberForReport[]>();
  return countActiveMembers(members);
}

// The totals at the top of the Attendance report
export function summariseAttendance(
  entries: AttendanceEntry[]
): AttendanceSummary {
  const summary: AttendanceSummary = {
    total: entries.length,
    dd: 0,
    flexi: 0,
    ga: 0,
    tasters: 0,
    cash: 0,
    card: 0,
    pay_later: 0,
  };
  entries.forEach((entry) => {
    if (entry.is_taster) summary.tasters += 1;
    else if (entry.is_ga) summary.ga += 1;
    else if (entry.membership_type === "DD") summary.dd += 1;
    else if (entry.membership_type === "flexi") summary.flexi += 1;

    if (entry.payment === "cash") summary.cash += entry.amount || 0;
    if (entry.payment === "card") summary.card += entry.amount || 0;
    if (entry.payment === "pay_later") summary.pay_later += 1;
  });
  return summary;
}

const NO_PACKS: PacksBought = { count: 0, amount_pence: 0 };

// Flexi sessions used at check-in between two dates ("YYYY-MM-DD",
// inclusive), and the flexi packs bought in those dates
export async function flexiSessionsReport(
  from: string,
  to: string
): Promise<FlexiSessionsReport> {
  const byVenue = await Checkins.aggregate<{ _id: string; sessions: number }>([
    {
      $match: {
        flexi_deducted: true,
        // "YYYY-MM-DD" strings sort the same as the dates they stand for
        session_date: { $gte: from, $lte: to },
      },
    },
    { $group: { _id: "$venue", sessions: { $sum: 1 } } },
    { $sort: { sessions: -1 } },
  ]);

  // Every top-up in the dates (UK calendar days), by how it was paid
  const packs = await Members.aggregate<{
    _id: string;
    count: number;
    amount_pence: number;
  }>([
    { $unwind: "$topUpDate" },
    {
      $addFields: {
        top_up_day: {
          $dateToString: {
            date: "$topUpDate.date",
            format: "%Y-%m-%d",
            timezone: "Europe/London",
          },
        },
      },
    },
    { $match: { top_up_day: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: "$topUpDate.method",
        count: { $sum: 1 },
        amount_pence: { $sum: { $ifNull: ["$topUpDate.amount_pence", 0] } },
      },
    },
  ]);
  const packsBy = (method: string): PacksBought => {
    const row = packs.find((pack) => pack._id === method);
    return row
      ? { count: row.count, amount_pence: row.amount_pence }
      : { ...NO_PACKS };
  };

  return {
    from,
    to,
    sessions_used: byVenue.reduce((sum, row) => sum + row.sessions, 0),
    by_venue: byVenue.map((row) => ({
      venue: row._id,
      sessions: row.sessions,
    })),
    packs: {
      online: packsBy("online"),
      cash: packsBy("cash"),
      card: packsBy("card"),
    },
  };
}
