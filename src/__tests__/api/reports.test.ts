/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database or login
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/checkin", () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { aggregate: jest.fn(), find: jest.fn() },
}));
jest.mock("../../lib/attendance", () => ({ listAttendance: jest.fn() }));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));

/* eslint-disable import/first */
import type { AttendanceEntry } from "@/src/lib/attendance";
import { listAttendance } from "@/src/lib/attendance";
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import { countActiveMembers, summariseAttendance } from "@/src/lib/reports";
import { formatPence } from "@/src/lib/reportsShared";
import activeMembers from "@/src/pages/api/admin/reports/active-members";
import attendanceReport from "@/src/pages/api/admin/reports/attendance";
import flexiSessions from "@/src/pages/api/admin/reports/flexi-sessions";
/* eslint-enable import/first */

const checkins = Checkins as unknown as Record<string, jest.Mock>;
const members = Members as unknown as Record<string, jest.Mock>;

type Handler = Parameters<typeof testApiHandler>[0]["handler"];

const get = (handler: Handler, params: Record<string, string> = {}) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler,
      params,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        resolve({
          status: res.status,
          body: (await res.json()) as Record<string, unknown>,
        });
      },
    });
  });

const NOW = new Date("2026-10-21T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue({ _id: "admin1" });
});

describe("Active members report", () => {
  it("Should count active members by type and home choir, the same way the site decides who's active", () => {
    const report = countActiveMembers(
      [
        { membership_type: "DD", active_mandate: true, home_choir: "Dorking" },
        // Direct Debit ended 3 days ago - still in the grace period
        {
          membership_type: "DD",
          home_choir: "Dorking",
          direct_debit_ended: {
            at: new Date(NOW.getTime() - 3 * DAY_MS),
            event: "cancelled",
          },
        },
        // Ended a month ago - not active
        {
          membership_type: "DD",
          home_choir: "Cobham",
          direct_debit_ended: {
            at: new Date(NOW.getTime() - 30 * DAY_MS),
            event: "cancelled",
          },
        },
        { membership_type: "flexi", home_choir: "Banstead" },
        { membership_type: "flexi_expired", home_choir: "Banstead" },
        // GAs count as GAs, whatever their membership type
        { membership_type: "DD", role: "ga", home_choir: "Banstead" },
        // A sign-up that was never finished - not counted at all
        { membership_type: "", home_choir: "Dorking" },
        { membership_type: "flexi" },
      ],
      NOW
    );

    expect(report.total).toBe(5);
    expect(report.by_type).toEqual({ dd: 2, flexi: 2, ga: 1 });
    expect(report.dd_grace).toBe(1);
    expect(report.dd_ended).toBe(1);
    expect(report.flexi_expired).toBe(1);
    expect(report.by_choir).toEqual([
      { choir: "Banstead", total: 2, dd: 0, flexi: 1, ga: 1 },
      { choir: "Dorking", total: 2, dd: 2, flexi: 0, ga: 0 },
      { choir: "No choir", total: 1, dd: 0, flexi: 1, ga: 0 },
    ]);
  });

  it("Should load the members and send the report", async () => {
    members.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ membership_type: "flexi" }]),
    });
    const res = await get(activeMembers);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it("Should be for admins only", async () => {
    (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Admins only" });
      return null;
    });
    const res = await get(activeMembers);
    expect(res.status).toBe(403);
    expect(members.find).not.toHaveBeenCalled();
  });
});

describe("Attendance report", () => {
  const entry = (extra: Partial<AttendanceEntry>): AttendanceEntry => ({
    id: "1",
    first_name: "A",
    last_name: "B",
    scanned_at: NOW.toISOString(),
    is_ga: false,
    ...extra,
  });

  it("Should total up who came and what was taken at the desk", () => {
    expect(
      summariseAttendance([
        entry({ membership_type: "DD" }),
        entry({ membership_type: "flexi", payment: "cash", amount: 95 }),
        entry({ membership_type: "flexi", payment: "card", amount: 85 }),
        entry({ membership_type: "flexi", payment: "pay_later" }),
        entry({ membership_type: "DD", payment: "not_paid" }),
        entry({ membership_type: "DD", is_ga: true }),
        entry({ is_taster: true }),
      ])
    ).toEqual({
      total: 7,
      dd: 2,
      flexi: 3,
      ga: 1,
      tasters: 1,
      cash: 95,
      card: 85,
      pay_later: 1,
      not_paid: 1,
    });
  });

  it("Should show one rehearsal's attendance", async () => {
    (listAttendance as jest.Mock).mockResolvedValue({
      entries: [entry({ membership_type: "DD" })],
      memberIds: ["m1"],
    });
    const res = await get(attendanceReport, {
      venue: "choir-dorking-surrey",
      date: "2026-10-20",
    });
    expect(res.status).toBe(200);
    expect(listAttendance).toHaveBeenCalledWith(
      "choir-dorking-surrey",
      "2026-10-20"
    );
    expect(res.body.summary).toMatchObject({ total: 1, dd: 1 });
  });

  it("Should need a choir and a proper date", async () => {
    expect((await get(attendanceReport, { date: "2026-10-20" })).status).toBe(
      400
    );
    expect(
      (await get(attendanceReport, { venue: "x", date: "20/10/2026" })).status
    ).toBe(400);
    expect(listAttendance).not.toHaveBeenCalled();
  });
});

describe("Flexi sessions report", () => {
  it("Should count sessions used by choir and packs bought by how they were paid", async () => {
    checkins.aggregate.mockResolvedValue([
      { _id: "choir-dorking-surrey", sessions: 7 },
      { _id: "choir-cobham-surrey", sessions: 3 },
    ]);
    members.aggregate.mockResolvedValue([
      { _id: "online", count: 2, amount_pence: 18000 },
      { _id: "cash", count: 1, amount_pence: 9500 },
    ]);

    const res = await get(flexiSessions, {
      from: "2026-10-01",
      to: "2026-10-21",
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      from: "2026-10-01",
      to: "2026-10-21",
      sessions_used: 10,
      by_venue: [
        { venue: "choir-dorking-surrey", sessions: 7 },
        { venue: "choir-cobham-surrey", sessions: 3 },
      ],
      packs: {
        online: { count: 2, amount_pence: 18000 },
        cash: { count: 1, amount_pence: 9500 },
        card: { count: 0, amount_pence: 0 },
      },
    });
    // Only check-ins that took a flexi session off, in the dates
    expect(checkins.aggregate.mock.calls[0][0][0]).toEqual({
      $match: {
        flexi_deducted: true,
        session_date: { $gte: "2026-10-01", $lte: "2026-10-21" },
      },
    });
  });

  it("Should refuse missing dates, or an end before the start", async () => {
    expect((await get(flexiSessions, { from: "2026-10-01" })).status).toBe(400);
    expect(
      (await get(flexiSessions, { from: "2026-10-21", to: "2026-10-01" }))
        .status
    ).toBe(400);
    expect(checkins.aggregate).not.toHaveBeenCalled();
  });

  it("Should write money as pounds", () => {
    expect(formatPence(9000)).toBe("£90");
    expect(formatPence(12345)).toBe("£123.45");
    expect(formatPence(0)).toBe("£0");
  });
});
