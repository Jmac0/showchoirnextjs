/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, Mailchimp or emails
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
}));
jest.mock("../../lib/models/checkin", () => ({
  __esModule: true,
  default: { updateOne: jest.fn(), deleteOne: jest.fn() },
}));
jest.mock("../../lib/mailchimp", () => ({
  contactsWithTag: jest.fn(),
  choirAudienceId: () => "CHOIR",
}));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("../../lib/auth/requireGA", () => ({ requireGA: jest.fn() }));
jest.mock("../../lib/checkins", () => ({
  ...jest.requireActual("../../lib/checkins"),
  createCheckin: jest.fn(),
  isCheckedIn: jest.fn(),
}));
jest.mock("../../lib/flexiExpiryCheck", () => ({
  checkFlexiExpiry: jest.fn(),
}));
jest.mock("../../lib/email/sendInviteEmail", () => ({
  sendInviteEmail: jest.fn(),
}));
jest.mock("../../lib/flexiMembers", () => ({
  ...jest.requireActual("../../lib/flexiMembers"),
  listFlexiMembers: jest.fn().mockResolvedValue([]),
}));

/* eslint-disable import/first */
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { requireGA } from "@/src/lib/auth/requireGA";
import { createCheckin } from "@/src/lib/checkins";
import { sendInviteEmail } from "@/src/lib/email/sendInviteEmail";
import { checkFlexiExpiry } from "@/src/lib/flexiExpiryCheck";
import { importFlexiFromMailchimp } from "@/src/lib/flexiImport";
import { contactsWithTag } from "@/src/lib/mailchimp";
import Members from "@/src/lib/models/member";
import sendFlexiInvites from "@/src/pages/api/admin/flexi-members/send-invites";
import checkInMember from "@/src/pages/api/member-resources/check-in-member";
import confirmFlexiSessions from "@/src/pages/api/member-resources/confirm-flexi-sessions";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const tagged = contactsWithTag as jest.Mock;

const post = (handler: unknown, body: object) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler: handler as never,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

// A database query that can be awaited, with or without .lean()/.select()
const query = (value: unknown) =>
  Object.assign(Promise.resolve(value), {
    lean: () => Promise.resolve(value),
    select: () => Promise.resolve(value),
  });

const contact = (email: string, extra = {}) => ({
  email,
  first_name: "Ann",
  last_name: "Smith",
  status: "subscribed",
  groups: ["Dorking"],
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  (requireGA as jest.Mock).mockResolvedValue({ id: "ga1" });
  (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin1" });
});

describe("Import Flexi members from Mailchimp", () => {
  it("Should create a Flexi member for each tagged contact, with sessions to confirm", async () => {
    tagged.mockResolvedValue([
      contact("ann@example.com"),
      contact("bob@example.com"),
    ]);
    members.findOne.mockReturnValue(query(null));

    const summary = await importFlexiFromMailchimp();

    expect(summary.created).toBe(2);
    expect(summary.tagFound).toBe(true);
    // Only the Choir audience - never Prospects (taster bookings)
    expect(tagged).toHaveBeenCalledTimes(1);
    expect(tagged).toHaveBeenCalledWith("CHOIR", "Flexi");
    expect(members.create).toHaveBeenCalledTimes(2);
    expect(members.create.mock.calls[0][0]).toMatchObject({
      email: "ann@example.com",
      home_choir: "Dorking",
      membership_type: "flexi",
      flexi_sessions: 0,
      flexi_sessions_confirmed: false,
      imported_from_mailchimp: true,
      invite: { status: "not_sent", send_count: 0 },
    });
    // Joined today, so the 6-month expiry starts from the import
    expect(members.create.mock.calls[0][0].date_joined).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/
    );
  });

  it("Should never touch existing members, and skip bounced emails", async () => {
    tagged.mockImplementation(async (listId: string) =>
      listId === "CHOIR"
        ? [
            contact("web@example.com"),
            contact("again@example.com"),
            contact("bounced@example.com", { status: "cleaned" }),
          ]
        : null
    );
    members.findOne.mockImplementation(({ email }) =>
      query(
        {
          "web@example.com": { membership_type: "DD" },
          "again@example.com": { imported_from_mailchimp: true },
        }[email as string] || null
      )
    );

    const summary = await importFlexiFromMailchimp();

    expect(members.create).not.toHaveBeenCalled();
    expect(summary.alreadyMember).toEqual(["Ann Smith (web@example.com)"]);
    expect(summary.alreadyImported).toBe(1);
    expect(summary.badEmail).toEqual(["Ann Smith (bounced@example.com)"]);
    expect(summary.tagFound).toBe(true);
  });

  it("Should only choose their choir if they're in exactly one group", async () => {
    tagged.mockImplementation(async (listId: string) =>
      listId === "CHOIR"
        ? [contact("ann@example.com", { groups: ["Dorking", "Cobham"] })]
        : null
    );
    members.findOne.mockReturnValue(query(null));
    await importFlexiFromMailchimp();
    expect(members.create.mock.calls[0][0].home_choir).toBe("");
  });
});

describe("Check-in - Flexi sessions still on paper", () => {
  const scan = () =>
    post(checkInMember, { email: "Ann@Example.com", venue: "dorking" });

  it("Should ask the GA to confirm their sessions, recording nothing", async () => {
    members.findOne.mockResolvedValue({
      id: "m1",
      first_name: "Ann",
      last_name: "Smith",
      membership_type: "flexi",
      flexi_sessions: 0,
      flexi_sessions_confirmed: false,
    });
    const res = await scan();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirm_sessions");
    expect(createCheckin).not.toHaveBeenCalled();
    expect(members.findOneAndUpdate).not.toHaveBeenCalled();
    // An unknown balance can't expire
    expect(checkFlexiExpiry).not.toHaveBeenCalled();
  });

  it("Should check in members who joined on the website as before", async () => {
    // No flexi_sessions_confirmed field at all
    members.findOne.mockResolvedValue({
      id: "m2",
      first_name: "Bob",
      membership_type: "flexi",
      flexi_sessions: 3,
    });
    (createCheckin as jest.Mock).mockResolvedValue({ id: "c1" });
    members.findOneAndUpdate.mockResolvedValue({ flexi_sessions: 2 });
    const res = await scan();
    expect(res.body.status).toBe("flexi");
    expect(res.body.flexi_sessions).toBe(2);
  });
});

describe("Confirm Flexi sessions (GA)", () => {
  const ann = { id: "m1", first_name: "Ann", flexi_sessions: 0 };

  it("Should add the paper sessions, once, and record who entered them", async () => {
    members.findOne.mockResolvedValue(ann);
    members.findOneAndUpdate.mockResolvedValue({
      first_name: "Ann",
      flexi_sessions: 4,
    });
    const res = await post(confirmFlexiSessions, {
      email: "ann@example.com",
      sessions: 4,
    });
    expect(res.status).toBe(200);
    expect(res.body.flexi_sessions).toBe(4);
    const [filter, update] = members.findOneAndUpdate.mock.calls[0];
    // Only while still unconfirmed
    expect(filter).toEqual({ _id: "m1", flexi_sessions_confirmed: false });
    // Added - anything bought online since the import is kept
    expect(update.$inc).toEqual({ flexi_sessions: 4 });
    expect(update.flexi_sessions_confirmed).toBe(true);
    expect(update.flexi_sessions_confirmation).toMatchObject({
      by: "ga1",
      sessions: 4,
    });
  });

  it("Should say so if another GA already entered them", async () => {
    members.findOne.mockResolvedValue({ ...ann, flexi_sessions: 6 });
    members.findOneAndUpdate.mockResolvedValue(null);
    const res = await post(confirmFlexiSessions, {
      email: "ann@example.com",
      sessions: 4,
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already been entered \(6\)/);
  });

  it.each([[1.5], ["4"], [-21], [101]])(
    "Should refuse %p sessions",
    async (sessions) => {
      const res = await post(confirmFlexiSessions, {
        email: "ann@example.com",
        sessions,
      });
      expect(res.status).toBe(400);
      expect(members.findOneAndUpdate).not.toHaveBeenCalled();
    }
  );

  it("Should allow members who owe sessions", async () => {
    members.findOne.mockResolvedValue(ann);
    members.findOneAndUpdate.mockResolvedValue({ flexi_sessions: -2 });
    const res = await post(confirmFlexiSessions, {
      email: "ann@example.com",
      sessions: -2,
    });
    expect(res.status).toBe(200);
  });

  it("Should be GAs only", async () => {
    (requireGA as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "GAs only" });
      return null;
    });
    const res = await post(confirmFlexiSessions, {
      email: "ann@example.com",
      sessions: 4,
    });
    expect(res.status).toBe(403);
    expect(members.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe("Flexi invites", () => {
  it("Should send Flexi invites only to imported Flexi members without an account", async () => {
    members.find.mockReturnValue(
      query([
        {
          id: "m1",
          first_name: "Ann",
          imported_from_mailchimp: true,
          invite: { status: "not_sent" },
        },
        { id: "m2", first_name: "Bob", invite: { status: "not_sent" } },
        {
          id: "m3",
          first_name: "Cat",
          imported_from_mailchimp: true,
          password: "hash",
        },
      ])
    );
    const res = await post(sendFlexiInvites, { ids: ["m1", "m2", "m3"] });
    expect(res.status).toBe(200);
    expect(res.body.sent).toEqual(["m1"]);
    expect(sendInviteEmail).toHaveBeenCalledTimes(1);
    expect((sendInviteEmail as jest.Mock).mock.calls[0][1]).toBe("flexi");
    expect(res.body.failed).toEqual([
      expect.objectContaining({ id: "m2" }),
      expect.objectContaining({ id: "m3", message: "Already has an account" }),
    ]);
  });
});
