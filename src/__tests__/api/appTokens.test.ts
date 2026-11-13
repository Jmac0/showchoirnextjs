/** @jest-environment node */
import jwt from "jsonwebtoken";
import { testApiHandler } from "next-test-api-route-handler";

// No real database
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), updateOne: jest.fn() },
}));

/* eslint-disable import/first */
import { NextApiRequest, NextApiResponse } from "next";

import Members from "@/src/lib/models/member";
/* eslint-enable import/first */

// The helpers read the secret when loaded, so load them once it's set
const SECRET = "test-secret";
process.env.JWT_SECRET = SECRET;
/* eslint-disable @typescript-eslint/no-var-requires, global-require */
const tokens =
  require("../../lib/auth/verifyJWT") as typeof import("@/src/lib/auth/verifyJWT");
const refresh = require("../../pages/api/auth/refresh").default;
const appLogout = require("../../pages/api/auth/appLogout").default;
/* eslint-enable @typescript-eslint/no-var-requires, global-require */

const MEMBER = "aaaaaaaaaaaaaaaaaaaaaaaa";
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

type Handler = (req: NextApiRequest, res: NextApiResponse) => unknown;
const post = (handler: Handler, body: object) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
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

beforeEach(() => jest.clearAllMocks());

describe("app login tokens", () => {
  it("accepts an access token on requests", () => {
    const access = tokens.signAccessToken(MEMBER);
    expect(tokens.getJWTPayload(bearer(access))).toEqual({ id: MEMBER });
  });

  it("won't take a refresh token as an access token", () => {
    const refreshToken = tokens.signRefreshToken(MEMBER);
    expect(tokens.getJWTPayload(bearer(refreshToken))).toBeNull();
  });

  it("turns down an old access token without a kind (the app refreshes)", () => {
    const old = jwt.sign({ id: MEMBER }, SECRET, { expiresIn: "15m" });
    expect(tokens.getJWTPayload(bearer(old))).toBeNull();
    // ...but an old refresh token still refreshes
    expect(tokens.verifyRefreshToken(old)).not.toBeNull();
  });

  it("won't refresh with an access token, or a non-string", () => {
    expect(
      tokens.verifyRefreshToken(tokens.signAccessToken(MEMBER))
    ).toBeNull();
    expect(tokens.verifyRefreshToken({ $ne: null })).toBeNull();
  });
});

describe("api/auth/refresh", () => {
  it("gives a new access token for a refresh token still in the list", async () => {
    const refreshToken = tokens.signRefreshToken(MEMBER);
    (Members.findOne as jest.Mock).mockResolvedValue({ id: MEMBER });
    const res = await post(refresh, { refreshToken });
    expect(res.status).toBe(200);
    expect(
      tokens.getJWTPayload(bearer(res.body.accessToken as string))
    ).toEqual({ id: MEMBER });
    expect(Members.findOne).toHaveBeenCalledWith({
      refresh_tokens: refreshToken,
    });
  });

  it("says no (403) once it's been logged out", async () => {
    (Members.findOne as jest.Mock).mockResolvedValue(null);
    const res = await post(refresh, {
      refreshToken: tokens.signRefreshToken(MEMBER),
    });
    expect(res.status).toBe(403);
  });

  it("says no to an access token without asking the database", async () => {
    const res = await post(refresh, {
      refreshToken: tokens.signAccessToken(MEMBER),
    });
    expect(res.status).toBe(403);
    expect(Members.findOne).not.toHaveBeenCalled();
  });
});

describe("api/auth/appLogout", () => {
  it("takes the phone's refresh token out of the member's list", async () => {
    const refreshToken = tokens.signRefreshToken(MEMBER);
    const res = await post(appLogout, { refreshToken });
    expect(res.status).toBe(200);
    expect(Members.updateOne).toHaveBeenCalledWith(
      { _id: MEMBER },
      { $pull: { refresh_tokens: refreshToken } }
    );
  });

  it("is fine with a token that's no good anyway", async () => {
    const res = await post(appLogout, { refreshToken: "rubbish" });
    expect(res.status).toBe(200);
    expect(Members.updateOne).not.toHaveBeenCalled();
  });
});
