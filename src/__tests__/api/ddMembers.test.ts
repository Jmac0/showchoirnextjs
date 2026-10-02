/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

import { canInvite } from "@/src/lib/ddMembers";
import { encryptEmail } from "@/src/lib/encryptEmail";
import { importFromGoCardless } from "@/src/lib/gocardlessImport";
import Members from "@/src/lib/models/member";
import completeAccount from "@/src/pages/api/signup/complete-account";
import resendInvite from "@/src/pages/api/signup/resend-invite";

// No real database, GoCardless or emails in these tests
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    exists: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  },
}));
jest.mock("../../lib/email/sendInviteEmail", () => ({
  sendInviteEmail: jest.fn(),
}));
// eslint-disable-next-line import/first, import/order
import { sendInviteEmail } from "@/src/lib/email/sendInviteEmail";

const members = Members as unknown as Record<string, jest.Mock>;

// findOne(...).select(...) returning this member
const found = (member: unknown) => ({
  select: jest.fn().mockResolvedValue(member),
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GO_CARDLESS_MONTHLY_AMOUNT = "3000";
});

// --- A pretend GoCardless with a few customers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asyncList = (items: any[]) =>
  async function* list() {
    yield* items;
  };

const mandate = (id: string, customer: string, status = "active") => ({
  id,
  status,
  links: { customer },
  created_at: "2024-03-05",
});
const customer = (id: string, given: string, family: string, email = "") => ({
  id,
  given_name: given,
  family_name: family,
  email,
});

const fakeGoCardless = () =>
  ({
    mandates: {
      all: asyncList([
        mandate("MD1", "CU1"),
        mandate("MD2", "CU2"),
        mandate("MD3", "CU3"),
        mandate("MD4", "CU4"),
        // Still being set up
        mandate("MD5", "CU5", "pending_submission"),
        mandate("MD6", "CU6"),
      ]),
    },
    customers: {
      all: asyncList([
        customer("CU1", "Ann", "Singer", " Ann@Example.com "),
        customer("CU2", "No", "Email"),
        customer("CU3", "Pat", "Parent", "pat@example.com"),
        customer("CU4", "Web", "Member", "web@example.com"),
        customer("CU5", "New", "Starter", "new@example.com"),
        customer("CU6", "Odd", "Amount", "odd@example.com"),
      ]),
    },
    subscriptions: {
      all: asyncList([
        { amount: "3000", links: { mandate: "MD1" } },
        { amount: "3000", links: { mandate: "MD2" } },
        // Legacy joint membership - two singers
        { amount: "5000", links: { mandate: "MD3" } },
        { amount: "3000", links: { mandate: "MD4" } },
        { amount: "3000", links: { mandate: "MD5" } },
        { amount: "3500", links: { mandate: "MD6" } },
      ]),
    },
  } as never);

describe("Import from GoCardless", () => {
  it("Should create active members, skip no-email customers, spot joint memberships and odd amounts, and not overwrite existing members", async () => {
    members.exists.mockResolvedValue(null);
    // web@example.com already joined on the website
    members.findOne.mockImplementation(({ email }) =>
      Promise.resolve(
        email === "web@example.com" ? { id: "existing", mandate: "" } : null
      )
    );

    const summary = await importFromGoCardless(fakeGoCardless());

    expect(summary.created).toBe(3);
    expect(summary.updatedExisting).toBe(1);
    expect(summary.skippedNoEmail).toEqual(["No Email"]);
    expect(summary.joint).toEqual(["Pat Parent"]);
    expect(summary.otherAmount).toEqual(["Odd Amount (£35)"]);
    expect(summary.mandateNotActive).toEqual([
      "New Starter (pending_submission)",
    ]);

    const ann = members.create.mock.calls[0][0];
    expect(ann).toMatchObject({
      email: "ann@example.com",
      membership_type: "DD",
      active_mandate: true,
      active_member: true,
      go_cardless_id: "CU1",
      mandate: "MD1",
      gc_mandate_status: "active",
      date_joined: "05/03/2024",
      imported_from_gocardless: true,
      invite: { status: "not_sent", send_count: 0 },
    });
    expect(ann.password).toBeUndefined();
    // Mandate still being set up - not imported
    expect(
      members.create.mock.calls.some(([m]) => m.email === "new@example.com")
    ).toBe(false);

    // The existing member only gets their Direct Debit linked
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: "existing" },
      expect.objectContaining({ go_cardless_id: "CU4", active_mandate: true })
    );
    expect(members.updateOne.mock.calls[0][1].first_name).toBeUndefined();
  });

  it("Should count a second Direct Debit with the same email on the first, not replace it", async () => {
    members.exists.mockResolvedValue(null);
    // Everyone's email matches a member already linked to customer CU1
    members.findOne.mockResolvedValue({
      id: "ann",
      go_cardless_id: "CU1",
      gc_subscription_amount: 3000,
    });

    const summary = await importFromGoCardless(fakeGoCardless());

    expect(summary.sharedEmail).toContain("Web Member");
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: "ann" },
      { gc_subscription_amount: 6000 }
    );
    // The first link is kept - never switched to another customer
    members.updateOne.mock.calls.forEach(([, update]) =>
      expect([undefined, "CU1"]).toContain(update.go_cardless_id)
    );
  });

  it("Should add nobody new when run again, but refresh mandate statuses", async () => {
    members.exists.mockResolvedValue({ _id: "already" });

    const summary = await importFromGoCardless(fakeGoCardless());

    expect(summary.created).toBe(0);
    expect(summary.alreadyImported).toBe(6);
    expect(members.create).not.toHaveBeenCalled();
    expect(members.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ go_cardless_id: "CU5" }),
      { gc_mandate_status: "pending_submission" }
    );
  });
});

describe("Who can be invited", () => {
  const ready = {
    active_mandate: true,
    gc_mandate_status: "active",
    invite: { status: "not_sent" as const },
  };
  it("Should only invite members with an active mandate and no account", () => {
    expect(canInvite(ready)).toBe(true);
    expect(
      canInvite({ ...ready, gc_mandate_status: "pending_submission" })
    ).toBe(false);
    // Cancelled since the import (the webhook turns active_mandate off)
    expect(canInvite({ ...ready, active_mandate: false })).toBe(false);
    expect(canInvite({ ...ready, password: "hash" })).toBe(false);
    expect(
      canInvite({ ...ready, invite: { status: "accepted" as const } })
    ).toBe(false);
  });
});

// --- Finishing the account from the invite link ---

const details = {
  firstName: "Ann",
  lastName: "Singer",
  streetAddress: "1 High St",
  townOrCity: "Dorking",
  county: "surrey",
  postCode: "RH4 1AA",
  phoneNumber: "07700900123",
  homeChoir: "Dorking",
  ageConfirm: true,
  consent: true,
  password: "secret",
};

const post = (handler: typeof completeAccount, body: object) =>
  new Promise<{ status: number; message: string }>((resolve) => {
    testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        resolve({ status: res.status, message: (await res.json()).message });
      },
    });
  });

describe("api/signup/complete-account", () => {
  it("Should turn away a link that isn't valid", async () => {
    const res = await post(completeAccount, { ...details, token: "nonsense" });
    expect(res.status).toBe(400);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should turn away someone who has already set up their account", async () => {
    members.findOne.mockReturnValue(found({ id: "m1", password: "hash" }));
    const res = await post(completeAccount, {
      ...details,
      token: encryptEmail("ann@example.com"),
    });
    expect(res.status).toBe(401);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should save their details and password and mark the invite accepted", async () => {
    members.findOne.mockReturnValue(found({ id: "m1" }));
    const res = await post(completeAccount, {
      ...details,
      token: encryptEmail("ann@example.com"),
    });
    expect(res.status).toBe(200);
    expect(members.findOne).toHaveBeenCalledWith({ email: "ann@example.com" });
    const saved = members.updateOne.mock.calls[0][1];
    expect(saved).toMatchObject({
      home_choir: "Dorking",
      age_confirm: true,
      "invite.status": "accepted",
    });
    // Hashed, not stored as typed
    expect(saved.password).toMatch(/^\$2/);
    // Their Direct Debit details aren't touched
    expect(saved.active_mandate).toBeUndefined();
    expect(saved.email).toBeUndefined();
  });
});

describe("api/signup/resend-invite", () => {
  it("Should give the same answer whether or not the email is a member", async () => {
    members.findOne.mockReturnValueOnce(found(null));
    const stranger = await post(resendInvite as never, {
      email: "nobody@example.com",
    });

    members.findOne.mockReturnValueOnce(
      found({
        id: "m1",
        email: "ann@example.com",
        active_mandate: true,
        gc_mandate_status: "active",
        invite: {},
      })
    );
    const member = await post(resendInvite as never, {
      email: "Ann@Example.com",
    });

    expect(stranger).toEqual(member);
    expect(sendInviteEmail).toHaveBeenCalledTimes(1);
  });

  it("Should not resend within 10 minutes, or to someone with an account", async () => {
    members.findOne.mockReturnValueOnce(
      found({ id: "m1", invite: { sent_at: new Date() } })
    );
    await post(resendInvite as never, { email: "ann@example.com" });
    members.findOne.mockReturnValueOnce(
      found({ id: "m1", password: "hash", invite: {} })
    );
    await post(resendInvite as never, { email: "ann@example.com" });

    expect(sendInviteEmail).not.toHaveBeenCalled();
  });
});
