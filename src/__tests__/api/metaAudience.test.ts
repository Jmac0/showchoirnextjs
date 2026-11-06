/** @jest-environment node */
import { getServerSession } from "next-auth/next";
import { testApiHandler } from "next-test-api-route-handler";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { encryptEmail } from "@/src/lib/encryptEmail";
import {
  META_AUDIENCE_WORDING_VERSION,
  metaAudienceChoice,
} from "@/src/lib/metaAudience";
import Members from "@/src/lib/models/member";
import report from "@/src/pages/api/admin/reports/meta-audience";
import memberChoice from "@/src/pages/api/members/meta-audience";
import createPassword from "@/src/pages/api/signup/createPassword";

// No real database or login
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { find: jest.fn(), findOne: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../../lib/models/checkin", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("../../lib/attendance", () => ({ listAttendance: jest.fn() }));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));

const members = Members as unknown as Record<string, jest.Mock>;

type Handler = Parameters<typeof testApiHandler>[0]["handler"];

const call = (
  handler: unknown,
  { body, url }: { body?: object; url?: string } = {}
) =>
  new Promise<{ status: number; text: string; headers: Headers }>((resolve) => {
    testApiHandler({
      handler: handler as Handler,
      url,
      test: async ({ fetch }) => {
        const res = await fetch(
          body
            ? {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            : {}
        );
        resolve({
          status: res.status,
          text: await res.text(),
          headers: res.headers as unknown as Headers,
        });
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  members.updateOne.mockResolvedValue({ matchedCount: 1 });
  (requireAdmin as jest.Mock).mockResolvedValue({ _id: "admin1" });
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { email: "ann@example.com" },
  });
});

describe("metaAudienceChoice", () => {
  it.each([[undefined], [false], ["true"], [1], [{}]])(
    "treats %j as a no",
    (value) => {
      expect(metaAudienceChoice(value).opted_in).toBe(false);
    }
  );

  it("records a real tick, with when and the wording they saw", () => {
    expect(metaAudienceChoice(true)).toEqual({
      opted_in: true,
      at: expect.any(Date),
      wording: META_AUDIENCE_WORDING_VERSION,
    });
  });
});

describe("api/members/meta-audience", () => {
  it("needs them to be logged in", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await call(memberChoice, { body: { optIn: true } });
    expect(res.status).toBe(401);
    expect(members.updateOne).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ optIn: "yes" }]])(
    "turns away anything but yes or no: %j",
    async (body) => {
      const res = await call(memberChoice, { body });
      expect(res.status).toBe(400);
      expect(members.updateOne).not.toHaveBeenCalled();
    }
  );

  it("saves a change of mind on their own record, with the date", async () => {
    const res = await call(memberChoice, { body: { optIn: false } });
    expect(res.status).toBe(200);
    expect(members.updateOne).toHaveBeenCalledWith(
      { email: "ann@example.com" },
      { meta_audience: expect.objectContaining({ opted_in: false }) }
    );
  });
});

describe("api/signup/createPassword", () => {
  const set = (extra: object) => {
    members.findOne.mockReturnValue({
      select: async () => ({ id: "m1" }),
    });
    return call(createPassword, {
      body: {
        token: encryptEmail("ann@example.com"),
        password: "secret-password",
        ...extra,
      },
    });
  };

  it("saves a no when the box isn't ticked, and still creates the account", async () => {
    const res = await set({});
    expect(res.status).toBe(200);
    const saved = members.updateOne.mock.calls[0][1];
    expect(saved.password).toMatch(/^\$2/);
    expect(saved.meta_audience.opted_in).toBe(false);
  });

  it("saves a yes when it's ticked", async () => {
    await set({ metaAudienceOptIn: true });
    expect(members.updateOne.mock.calls[0][1].meta_audience.opted_in).toBe(
      true
    );
  });
});

describe("api/admin/reports/meta-audience", () => {
  const list = () =>
    members.find.mockReturnValue({
      lean: async () => [
        { email: "flexi@example.com", membership_type: "flexi" },
        {
          email: "dd@example.com",
          membership_type: "DD",
          active_mandate: true,
        },
        // Direct Debit stopped, so no longer a member
        {
          email: "gone@example.com",
          membership_type: "DD",
          active_mandate: false,
        },
        { email: "expired@example.com", membership_type: "flexi_expired" },
      ],
    });

  it("is for admins only, and never reads the list otherwise", async () => {
    (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Admins only" });
      return null;
    });
    const res = await call(report, { url: "/?download=1" });
    expect(res.status).toBe(403);
    expect(members.find).not.toHaveBeenCalled();
  });

  it("only asks for members who said yes and are confirmed over 18", async () => {
    list();
    await call(report);
    const [filter, fields] = members.find.mock.calls[0];
    expect(filter).toEqual({
      "meta_audience.opted_in": true,
      age_confirm: true,
    });
    expect(fields.first_name).toBeUndefined();
    expect(fields.phone_number).toBeUndefined();
  });

  it("counts active members only", async () => {
    list();
    const res = await call(report);
    expect(JSON.parse(res.text)).toEqual({ total: 2 });
  });

  it("downloads their emails and nothing else, not to be cached", async () => {
    list();
    const res = await call(report, { url: "/?download=1" });
    expect(res.text).toBe("email\nflexi@example.com\ndd@example.com");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
