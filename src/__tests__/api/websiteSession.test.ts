/** @jest-environment node */
// No real database
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

/* eslint-disable import/first */
import type { JWT } from "next-auth/jwt";

import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";
/* eslint-enable import/first */

const MEMBER = "aaaaaaaaaaaaaaaaaaaaaaaa";
const jwt = authOptions.callbacks!.jwt! as unknown as (args: {
  token: JWT;
  user?: { role: string };
  account?: object | null;
}) => Promise<JWT>;

const inDatabase = (member: object | null) =>
  (Members.findOne as jest.Mock).mockReturnValue({
    select: () => ({ lean: jest.fn().mockResolvedValue(member) }),
  });

const HOUR = 60 * 60 * 1000;
// A website login that started an hour ago, last checked 2 minutes ago
const loggedIn = (): JWT => ({
  sub: MEMBER,
  email: "ann@example.com",
  sid: "this-login",
  signed_in_at: Date.now() - HOUR,
  checked_at: Date.now() - 2 * 60 * 1000,
});

beforeEach(() => jest.clearAllMocks());

describe("website login (NextAuth jwt callback)", () => {
  it("gives a new login its own id and start time", async () => {
    const token = await jwt({
      token: {},
      user: { role: "admin" },
      account: { provider: "credentials" },
    });
    expect(token.role).toBe("admin");
    expect(typeof token.sid).toBe("string");
    expect(typeof token.signed_in_at).toBe("number");
  });

  it("carries on when the password hasn't changed since", async () => {
    inDatabase({ password_changed_at: new Date(Date.now() - 2 * HOUR) });
    await expect(jwt({ token: loggedIn() })).resolves.toMatchObject({
      sid: "this-login",
    });
    expect(Members.findOne).toHaveBeenCalledWith({ _id: MEMBER });
  });

  it("ends a login once the password's been changed elsewhere", async () => {
    inDatabase({
      password_changed_at: new Date(),
      password_changed_by: "another-login",
    });
    await expect(jwt({ token: loggedIn() })).rejects.toThrow(
      "Password changed"
    );
  });

  it("keeps the login the password was changed from", async () => {
    inDatabase({
      password_changed_at: new Date(),
      password_changed_by: "this-login",
    });
    await expect(jwt({ token: loggedIn() })).resolves.toBeTruthy();
  });

  it("ends the login of a deleted account", async () => {
    inDatabase(null);
    await expect(jwt({ token: loggedIn() })).rejects.toThrow(
      "no longer exists"
    );
  });

  it("treats a login from before these checks as old, so a password change ends it", async () => {
    inDatabase({ password_changed_at: new Date(Date.now() - HOUR) });
    const legacy: JWT = { sub: MEMBER, email: "ann@example.com" };
    await expect(jwt({ token: legacy })).rejects.toThrow("Password changed");
  });

  it("keeps the login when the database doesn't answer", async () => {
    (Members.findOne as jest.Mock).mockImplementation(() => {
      throw new Error("Mongo is down");
    });
    const error = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const token = loggedIn();
    await expect(jwt({ token })).resolves.toMatchObject({ sid: "this-login" });
    error.mockRestore();
  });

  it("only looks at the database once a minute", async () => {
    await jwt({ token: { ...loggedIn(), checked_at: Date.now() } });
    expect(Members.findOne).not.toHaveBeenCalled();
  });
});
