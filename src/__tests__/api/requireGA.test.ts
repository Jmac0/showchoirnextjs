/** @jest-environment node */
import { NextApiRequest, NextApiResponse } from "next";

// No real database or login
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../../lib/auth/verifyJWT", () => ({ getJWTPayload: jest.fn() }));

/* eslint-disable import/first */
import { requireGA } from "@/src/lib/auth/requireGA";
import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import Members from "@/src/lib/models/member";
/* eslint-enable import/first */

const { findById } = Members as unknown as { findById: jest.Mock };

// A pretend reply that remembers its status code
const fakeRes = () => {
  const res = { statusCode: 200 } as NextApiResponse & { statusCode: number };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as NextApiResponse["status"];
  res.json = jest.fn() as unknown as NextApiResponse["json"];
  return res;
};
const req = { headers: { authorization: "Bearer token" } } as NextApiRequest;

beforeEach(() => {
  jest.clearAllMocks();
  (getJWTPayload as jest.Mock).mockReturnValue({ id: "m1" });
});

describe("requireGA", () => {
  it.each(["ga", "admin"])(
    "Should let a %s in (admins stand in on the desk)",
    async (role) => {
      findById.mockResolvedValue({ _id: "m1", role });
      const res = fakeRes();
      expect(await requireGA(req, res)).toEqual({ _id: "m1", role });
      expect(res.status).not.toHaveBeenCalled();
    }
  );

  it("Should keep other members out", async () => {
    findById.mockResolvedValue({ _id: "m1", role: "" });
    const res = fakeRes();
    expect(await requireGA(req, res)).toBeNull();
    expect(res.statusCode).toBe(403);
  });

  it("Should need a valid login", async () => {
    (getJWTPayload as jest.Mock).mockReturnValue(null);
    const res = fakeRes();
    expect(await requireGA(req, res)).toBeNull();
    expect(res.statusCode).toBe(401);
  });
});
