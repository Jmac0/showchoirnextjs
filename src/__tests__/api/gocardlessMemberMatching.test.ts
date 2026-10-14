/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";
import crypto from "node:crypto";

// No real database, GoCardless, Mailchimp or emails
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    exists: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  },
  isDuplicateEmailError: () => false,
}));
jest.mock("../../lib/models/goCardlessEventLog", () => ({
  __esModule: true,
  default: { exists: jest.fn(), create: jest.fn() },
}));
jest.mock("../../lib/gocardless", () => {
  const client = {
    customers: { find: jest.fn(), update: jest.fn() },
    billingRequests: { find: jest.fn() },
    mandates: { find: jest.fn() },
  };
  return {
    goCardlessClient: () => client,
    MEMBER_ID_KEY: "member_id",
    monthlyAmountPence: () => "3000",
  };
});
jest.mock("../../lib/memberAudience", () => ({ memberJoined: jest.fn() }));
jest.mock("../../lib/mailchimp", () => ({ changeContactEmail: jest.fn() }));
jest.mock("../../lib/email/sendWelcomeEmail", () => ({
  sendWelcomeEmail: jest.fn(),
}));
jest.mock("../../lib/email/sendDirectDebitEndedEmail", () => ({
  sendDirectDebitEndedEmail: jest.fn(),
}));
jest.mock("../../lib/auth/requireAdmin", () => ({
  requireAdmin: jest.fn(),
}));

/* eslint-disable import/first */
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { goCardlessClient } from "@/src/lib/gocardless";
import { changeContactEmail } from "@/src/lib/mailchimp";
import GoCardlessEventLog from "@/src/lib/models/goCardlessEventLog";
import Members from "@/src/lib/models/member";
import adminChangeEmail from "@/src/pages/api/admin/change-email";
import webhooks, { config } from "@/src/pages/api/gocardless/webhooks";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const eventLog = GoCardlessEventLog as unknown as Record<string, jest.Mock>;
const gc = goCardlessClient() as unknown as Record<
  string,
  Record<string, jest.Mock>
>;

// A database query that can be awaited, with or without .select(...)
const query = (value: unknown) =>
  Object.assign(Promise.resolve(value), {
    select: () => Promise.resolve(value),
  });

const SECRET = "test-webhook-secret";
process.env.GO_CARDLESS_WEBHOOK_SECRET = SECRET;

// Sends GoCardless events to the webhook, signed like GoCardless does
const sendEvents = (events: object[]) =>
  new Promise<number>((resolve) => {
    const body = JSON.stringify({ events });
    testApiHandler({
      // The route reads the raw body itself (bodyParser: false)
      handler: Object.assign(webhooks, { config }),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Webhook-Signature": crypto
              .createHmac("sha256", SECRET)
              .update(body)
              .digest("hex"),
          },
          body,
        });
        resolve(res.status);
      },
    });
  });

const MEMBER_ID = "652f1c2b9d3e4a0012345678";
const ann = { id: MEMBER_ID, email: "ann@example.com", date_joined: "1/1/24" };

const fulfilled = {
  id: "EV1",
  resource_type: "billing_requests",
  action: "fulfilled",
  links: {
    billing_request: "BRQ1",
    customer: "CU1",
    mandate_request_mandate: "MD1",
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  eventLog.exists.mockResolvedValue(null);
  members.find.mockResolvedValue([]);
  // GoCardless has a different email from ours - the case this is all for
  gc.customers.find.mockResolvedValue({ id: "CU1", email: "old@example.com" });
});

describe("GoCardless webhook - finding the member when emails differ", () => {
  it("Should find them by the member id saved on the GoCardless request", async () => {
    gc.billingRequests.find.mockResolvedValue({
      metadata: { member_id: MEMBER_ID },
    });
    members.findById.mockReturnValue(query(ann));

    expect(await sendEvents([fulfilled])).toBe(200);
    expect(members.findById).toHaveBeenCalledWith(MEMBER_ID);
    expect(members.findOne).not.toHaveBeenCalled();
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: MEMBER_ID },
      expect.objectContaining({ active_mandate: true, go_cardless_id: "CU1" })
    );
  });

  it("Should then find them by their GoCardless customer", async () => {
    gc.billingRequests.find.mockResolvedValue({ metadata: {} });
    members.findOne.mockReturnValue(query(ann));

    expect(await sendEvents([fulfilled])).toBe(200);
    expect(members.findOne).toHaveBeenCalledTimes(1);
    expect(members.findOne).toHaveBeenCalledWith({
      go_cardless_id: "CU1",
      paid_by_member: { $in: [null, ""] },
    });
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: MEMBER_ID },
      expect.objectContaining({ active_mandate: true })
    );
  });

  it("Should only use the GoCardless email as a last resort", async () => {
    gc.billingRequests.find.mockResolvedValue({ metadata: {} });
    members.findOne
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(ann));

    expect(await sendEvents([fulfilled])).toBe(200);
    expect(members.findOne).toHaveBeenLastCalledWith({
      email: "old@example.com",
    });
    expect(members.updateOne).toHaveBeenCalled();
  });
});

describe("GoCardless webhook - a Direct Debit ending", () => {
  const cancelled = {
    id: "EV2",
    resource_type: "mandates",
    action: "cancelled",
    links: { mandate: "MD1" },
    details: { cause: "bank_account_closed" },
  };

  it("Should find who's on it by the mandate we saved", async () => {
    members.exists.mockResolvedValue({ _id: MEMBER_ID });
    members.find.mockResolvedValue([ann]);

    expect(await sendEvents([cancelled])).toBe(200);
    expect(gc.mandates.find).not.toHaveBeenCalled();
    expect(members.updateMany).toHaveBeenCalledWith(
      { mandate: "MD1", active_mandate: true },
      expect.objectContaining({ active_mandate: false })
    );
  });

  it("Should otherwise use the customer or email - but not members on a newer Direct Debit", async () => {
    members.exists.mockResolvedValue(null);
    gc.mandates.find.mockResolvedValue({ links: { customer: "CU1" } });
    members.find.mockResolvedValue([ann]);

    expect(await sendEvents([cancelled])).toBe(200);
    expect(members.updateMany).toHaveBeenCalledWith(
      {
        $or: [{ go_cardless_id: "CU1" }, { email: "old@example.com" }],
        mandate: { $in: [null, ""] },
        active_mandate: true,
      },
      expect.objectContaining({ active_mandate: false })
    );
  });
});

describe("Admin - change a member's email", () => {
  const post = (body: object) =>
    new Promise<{ status: number; message: string }>((resolve) => {
      testApiHandler({
        handler: adminChangeEmail,
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

  const dd = {
    id: MEMBER_ID,
    first_name: "Ann",
    last_name: "Smith",
    email: "ann@example.com",
    go_cardless_id: "CU1",
    invite: { status: "sent" },
  };

  beforeEach(() => {
    (requireAdmin as jest.Mock).mockResolvedValue({ role: "admin" });
    members.exists.mockResolvedValue(null);
  });

  it("Should only be for admins", async () => {
    (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Admins only" });
      return null;
    });
    const res = await post({
      current_email: "ann@example.com",
      new_email: "ann@new.com",
    });
    expect(res.status).toBe(403);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should say if nobody has the current email", async () => {
    members.findOne.mockResolvedValue(null);
    const res = await post({
      current_email: "nobody@example.com",
      new_email: "ann@new.com",
    });
    expect(res.status).toBe(404);
  });

  it("Should refuse an email another member uses", async () => {
    members.findOne.mockResolvedValue(dd);
    members.exists.mockResolvedValue({ _id: "someone-else" });
    const res = await post({
      current_email: "ann@example.com",
      new_email: "taken@example.com",
    });
    expect(res.status).toBe(409);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should change it in GoCardless, our database and Mailchimp", async () => {
    members.findOne.mockResolvedValue(dd);
    gc.customers.find.mockResolvedValue({ email: "ann@example.com" });
    const res = await post({
      current_email: " Ann@Example.com ",
      new_email: "Ann@New.com",
    });
    expect(res.status).toBe(200);
    expect(res.message).toMatch(/GoCardless updated too/);
    expect(gc.customers.update).toHaveBeenCalledWith("CU1", {
      email: "ann@new.com",
    });
    // The invite already sent had the old email - it needs sending again
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: MEMBER_ID },
      {
        email: "ann@new.com",
        $unset: { pending_email: 1 },
        "invite.status": "not_sent",
      }
    );
    expect(changeContactEmail).toHaveBeenCalledWith(
      "ann@example.com",
      "ann@new.com"
    );
  });

  it("Should leave GoCardless alone if it has someone else's email", async () => {
    members.findOne.mockResolvedValue(dd);
    gc.customers.find.mockResolvedValue({ email: "parent@example.com" });
    const res = await post({
      current_email: "ann@example.com",
      new_email: "ann@new.com",
    });
    expect(res.status).toBe(200);
    expect(res.message).toMatch(/parent@example.com.*left as it is/);
    expect(gc.customers.update).not.toHaveBeenCalled();
    expect(members.updateOne).toHaveBeenCalled();
  });
});
