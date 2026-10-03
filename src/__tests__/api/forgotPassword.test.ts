/** @jest-environment node */
import bcrypt from "bcrypt";
import { testApiHandler } from "next-test-api-route-handler";
import crypto from "node:crypto";

// No real database or emails
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../../lib/email/sendPasswordResetEmail", () => ({
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock("../../lib/loginLimiter", () => ({ clearLoginFailures: jest.fn() }));

/* eslint-disable import/first */
import { sendPasswordResetEmail } from "@/src/lib/email/sendPasswordResetEmail";
import { clearLoginFailures } from "@/src/lib/loginLimiter";
import Members from "@/src/lib/models/member";
import forgotPassword from "@/src/pages/api/members/forgot-password";
import resetPassword from "@/src/pages/api/members/reset-password";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const send = sendPasswordResetEmail as jest.Mock;

const post = (handler: typeof forgotPassword, body: object) =>
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

describe("Forgot password - asking for a link", () => {
  it("Should give the same answer whether or not the email is a member's", async () => {
    members.findOne.mockResolvedValueOnce(null);
    const stranger = await post(forgotPassword, { email: "who@example.com" });
    members.findOne.mockResolvedValueOnce({
      id: "m1",
      email: "ann@example.com",
      first_name: "Ann",
    });
    const member = await post(forgotPassword, { email: " Ann@Example.com " });

    expect(stranger).toEqual(member);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("Should email a one-hour link and store only a hash of it", async () => {
    members.findOne.mockResolvedValue({ id: "m1", email: "ann@example.com" });
    await post(forgotPassword, { email: "ann@example.com" });

    const token = send.mock.calls[0][1];
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const saved = members.updateOne.mock.calls[0][1].password_reset;
    expect(saved.token_hash).toBe(
      crypto.createHash("sha256").update(token).digest("hex")
    );
    const minutesLeft = (saved.expires_at.getTime() - Date.now()) / 60000;
    expect(Math.round(minutesLeft)).toBe(60);
  });

  it("Should not email a link that wasn't saved", async () => {
    members.findOne.mockResolvedValue({ id: "m1", email: "ann@example.com" });
    members.updateOne.mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await post(forgotPassword, { email: "ann@example.com" });
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("Should not send again within a minute", async () => {
    members.findOne.mockResolvedValue({
      id: "m1",
      email: "ann@example.com",
      password_reset: { sent_at: new Date() },
    });
    await post(forgotPassword, { email: "ann@example.com" });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("Forgot password - choosing a new one from the link", () => {
  const token = "b".repeat(64);

  it("Should turn away a bad, expired or used link", async () => {
    members.findOne.mockResolvedValue(null);
    expect(
      (await post(resetPassword, { token, password: "newpass123" })).status
    ).toBe(400);
    expect(
      (await post(resetPassword, { token: "nope", password: "newpass123" }))
        .status
    ).toBe(400);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it("Should need at least 5 characters", async () => {
    const res = await post(resetPassword, { token, password: "four" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5 characters/);
  });

  it("Should set the password, use up the link, log the app out everywhere and clear any lock-out", async () => {
    members.findOne.mockResolvedValue({ id: "m1", email: "ann@example.com" });
    const res = await post(resetPassword, { token, password: "newpass123" });

    expect(res.status).toBe(200);
    const saved = members.updateOne.mock.calls[0][1];
    expect(await bcrypt.compare("newpass123", saved.password)).toBe(true);
    expect(saved.refresh_tokens).toEqual([]);
    expect(saved.$unset).toEqual({ password_reset: 1 });
    expect(clearLoginFailures).toHaveBeenCalledWith("ann@example.com");
  });
});
