/** @jest-environment node */
import bcrypt from "bcrypt";
import { testApiHandler } from "next-test-api-route-handler";
import crypto from "node:crypto";

// No real database, login, GoCardless, Mailchimp or emails
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), exists: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../../lib/email/sendConfirmEmailChange", () => ({
  sendConfirmEmailChange: jest.fn(),
}));
jest.mock("../../lib/mailchimp", () => ({ changeContactEmail: jest.fn() }));
jest.mock("../../lib/gocardless", () => {
  const client = { customers: { find: jest.fn(), update: jest.fn() } };
  return { goCardlessClient: () => client };
});

/* eslint-disable import/first */
import { sendConfirmEmailChange } from "@/src/lib/email/sendConfirmEmailChange";
import { goCardlessClient } from "@/src/lib/gocardless";
import { changeContactEmail } from "@/src/lib/mailchimp";
import Members from "@/src/lib/models/member";
import changeEmail from "@/src/pages/api/members/change-email";
import confirmEmail from "@/src/pages/api/members/confirm-email";
/* eslint-enable import/first */

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const { getServerSession } = require("next-auth/next");

const members = Members as unknown as Record<string, jest.Mock>;
const gc = goCardlessClient() as unknown as {
  customers: Record<string, jest.Mock>;
};

const post = (handler: typeof changeEmail, body: object) =>
  new Promise<{ status: number; body: Record<string, string> }>((resolve) => {
    testApiHandler({
      handler,
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

beforeEach(() => {
  jest.clearAllMocks();
  // The database saved the change
  members.updateOne.mockResolvedValue({ modifiedCount: 1 });
});

describe("Change email - asking", () => {
  const passwordHash = bcrypt.hashSync("secret", 4);
  beforeEach(() => {
    getServerSession.mockResolvedValue({ user: { email: "ann@example.com" } });
    members.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        id: "m1",
        first_name: "Ann",
        password: passwordHash,
      }),
    });
    members.exists.mockResolvedValue(null);
  });

  it("Should need the right password", async () => {
    const res = await post(changeEmail, {
      currentPassword: "wrong",
      newEmail: "new@example.com",
    });
    expect(res.status).toBe(400);
    expect(sendConfirmEmailChange).not.toHaveBeenCalled();
  });

  it("Should refuse an email another member uses", async () => {
    members.exists.mockResolvedValue({ _id: "someone" });
    const res = await post(changeEmail, {
      currentPassword: "secret",
      newEmail: "taken@example.com",
    });
    expect(res.status).toBe(409);
  });

  it("Should change nothing yet - just email a link to the new address", async () => {
    const res = await post(changeEmail, {
      currentPassword: "secret",
      newEmail: " New@Example.com ",
    });
    expect(res.status).toBe(200);
    const saved = members.updateOne.mock.calls[0][1];
    expect(saved.email).toBeUndefined();
    expect(saved.pending_email.email).toBe("new@example.com");
    expect(sendConfirmEmailChange).toHaveBeenCalledWith(
      expect.anything(),
      "new@example.com",
      expect.stringMatching(/^[0-9a-f]{64}$/)
    );
    // Only a hash of the link's token is stored
    const token = (sendConfirmEmailChange as jest.Mock).mock.calls[0][2];
    expect(saved.pending_email.token_hash).toBe(
      crypto.createHash("sha256").update(token).digest("hex")
    );
  });
});

describe("Change email - confirming from the link", () => {
  const token = "a".repeat(64);
  const pending = (over = {}) => ({
    id: "m1",
    email: "ann@example.com",
    go_cardless_id: "CU1",
    pending_email: { email: "new@example.com" },
    ...over,
  });
  beforeEach(() => members.exists.mockResolvedValue(null));

  it("Should turn away a bad or expired link", async () => {
    members.findOne.mockResolvedValue(null);
    expect((await post(confirmEmail, { token })).status).toBe(400);
    expect((await post(confirmEmail, { token: "nope" })).status).toBe(400);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should change GoCardless, then our database, then Mailchimp", async () => {
    members.findOne.mockResolvedValue(pending());
    gc.customers.find.mockResolvedValue({ email: "ann@example.com" });

    const res = await post(confirmEmail, { token });

    expect(res.status).toBe(200);
    expect(gc.customers.update).toHaveBeenCalledWith("CU1", {
      email: "new@example.com",
    });
    expect(members.updateOne).toHaveBeenCalledWith(
      { _id: "m1" },
      { email: "new@example.com", $unset: { pending_email: 1 } }
    );
    expect(changeContactEmail).toHaveBeenCalledWith(
      "ann@example.com",
      "new@example.com"
    );
  });

  it("Should change nothing if GoCardless fails", async () => {
    members.findOne.mockResolvedValue(pending());
    gc.customers.find.mockResolvedValue({ email: "ann@example.com" });
    gc.customers.update.mockRejectedValue(new Error("GoCardless is down"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect((await post(confirmEmail, { token })).status).toBe(500);
    expect(members.updateOne).not.toHaveBeenCalled();
    expect(changeContactEmail).not.toHaveBeenCalled();
  });

  it("Should leave GoCardless alone for an extra singer, or when it has a different email (e.g. the parent who pays)", async () => {
    members.findOne.mockResolvedValue(pending({ paid_by_member: "payer" }));
    await post(confirmEmail, { token });
    members.findOne.mockResolvedValue(pending());
    gc.customers.find.mockResolvedValue({ email: "parent@example.com" });
    await post(confirmEmail, { token });

    expect(gc.customers.update).not.toHaveBeenCalled();
    expect(members.updateOne).toHaveBeenCalledTimes(2);
  });
});
