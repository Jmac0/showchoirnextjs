/** @jest-environment node */
import bcrypt from "bcrypt";
import { testApiHandler } from "next-test-api-route-handler";

// No real database; the attempt limiter is checked separately below
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock("../../lib/loginLimiter", () => ({
  ...jest.requireActual("../../lib/loginLimiter"),
  isLoginBlocked: jest.fn(),
  recordLoginFailure: jest.fn(),
  clearLoginFailures: jest.fn(),
}));

/* eslint-disable import/first */
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "@/src/lib/loginLimiter";
import Members from "@/src/lib/models/member";
/* eslint-enable import/first */

// The login reads its signing secret when it's first loaded, so set it
// before loading it
process.env.JWT_SECRET = "test-secret";
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const appLogin = require("../../pages/api/auth/appLogin").default;

const members = Members as unknown as Record<string, jest.Mock>;
const found = (member: unknown) => ({
  select: jest.fn().mockResolvedValue(member),
});

const login = (body: object) =>
  new Promise<{ status: number; body: Record<string, string> }>((resolve) => {
    testApiHandler({
      handler: appLogin,
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
  (isLoginBlocked as jest.Mock).mockResolvedValue(false);
});

describe("App login", () => {
  it("Should only accept a plain text email (no database tricks)", async () => {
    const res = await login({ email: { $ne: null }, password: "anything" });
    expect(res.status).toBe(400);
    expect(members.findOne).not.toHaveBeenCalled();
  });

  it("Should refuse - without even checking the password - after too many attempts", async () => {
    (isLoginBlocked as jest.Mock).mockResolvedValue(true);
    const res = await login({ email: "ann@example.com", password: "guess" });
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many attempts/i);
    expect(members.findOne).not.toHaveBeenCalled();
  });

  it("Should count a wrong password, with the same message as an unknown email", async () => {
    members.findOne.mockReturnValue(
      found({ id: "m1", password: bcrypt.hashSync("right-pass", 4) })
    );
    const wrong = await login({ email: "ann@example.com", password: "wrong" });
    members.findOne.mockReturnValue(found(null));
    const unknown = await login({ email: "who@example.com", password: "x" });

    expect(wrong.status).toBe(401);
    expect(unknown).toEqual(wrong);
    expect(recordLoginFailure).toHaveBeenCalledTimes(2);
  });

  it("Should turn away a member with no password yet (not crash)", async () => {
    members.findOne.mockReturnValue(found({ id: "m1" }));
    const res = await login({ email: "new@example.com", password: "x" });
    expect(res.status).toBe(401);
  });

  it("Should log in with the password exactly as typed, and clear the failures", async () => {
    members.findOne.mockReturnValue(
      found({ id: "m1", password: bcrypt.hashSync(" spaced pass ", 4) })
    );
    const res = await login({
      email: " Ann@Example.com ",
      password: " spaced pass ",
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(clearLoginFailures).toHaveBeenCalledWith("ann@example.com");
  });
});
