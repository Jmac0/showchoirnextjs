/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database or login
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/announcement", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("../../lib/auth/verifyJWT", () => ({ getJWTPayload: jest.fn() }));
jest.mock("../../lib/auth/requireActiveMember", () => ({
  requireActiveMember: jest.fn(),
}));

/* eslint-disable import/first */
import { announcementShareText } from "@/src/lib/announcementsShared";
import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import Announcements from "@/src/lib/models/announcement";
import Members from "@/src/lib/models/member";
import adminAnnouncement from "@/src/pages/api/admin/announcements/[id]";
import adminAnnouncements from "@/src/pages/api/admin/announcements/index";
import memberAnnouncements from "@/src/pages/api/member-resources/announcements";
/* eslint-enable import/first */

const announcements = Announcements as unknown as Record<string, jest.Mock>;
const members = Members as unknown as Record<string, jest.Mock>;

const ID = "6ac11011a04174ee4d84f330";
const ADMIN = {
  _id: "admin1",
  role: "admin",
  first_name: "Ada",
  last_name: "Min",
};

// A query that ends in .lean() (after .sort())
const query = (result: unknown) => {
  const chain: { sort: jest.Mock; lean: jest.Mock } = {
    sort: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

type Handler = Parameters<typeof testApiHandler>[0]["handler"];
const call = (
  handler: Handler,
  method: string,
  body?: object,
  headers: Record<string, string> = {},
  params: Record<string, string> = {}
) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler,
      params,
      test: async ({ fetch }) => {
        const res = await fetch({
          method,
          headers: { "Content-Type": "application/json", ...headers },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        resolve({
          status: res.status,
          body: (await res.json()) as Record<string, unknown>,
        });
      },
    });
  });

const forbidden = async (
  _req: unknown,
  res: { status: (n: number) => { json: (b: object) => void } }
) => {
  res.status(403).json({ message: "Forbidden" });
  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  // Logged in on the website as an admin (no Bearer token)
  (requireAdmin as jest.Mock).mockResolvedValue(ADMIN);
  announcements.find.mockReturnValue(
    query([
      {
        _id: ID,
        title: "Concert",
        message: "Saturday!",
        pinned: true,
        created_by: { name: "Ada Min" },
        created_at: new Date("2026-11-04T19:00:00Z"),
      },
    ])
  );
  announcements.findByIdAndUpdate.mockResolvedValue({ _id: ID });
  announcements.findByIdAndDelete.mockResolvedValue({ _id: ID });
});

describe("Announcements admin", () => {
  it("Should post an announcement, trimmed, with who wrote it", async () => {
    const res = await call(adminAnnouncements, "POST", {
      title: " Concert ",
      message: " Saturday! ",
      pinned: true,
    });
    expect(res.status).toBe(201);
    expect(announcements.create).toHaveBeenCalledWith({
      title: "Concert",
      message: "Saturday!",
      pinned: true,
      created_by: { id: "admin1", name: "Ada Min" },
    });
    expect(res.body.announcements).toEqual([
      {
        id: ID,
        title: "Concert",
        message: "Saturday!",
        pinned: true,
        created_at: "2026-11-04T19:00:00.000Z",
        updated_at: null,
        author_name: "Ada Min",
      },
    ]);
  });

  it("Should list pinned first, then newest", async () => {
    await call(adminAnnouncements, "GET");
    expect(announcements.find.mock.results[0].value.sort).toHaveBeenCalledWith({
      pinned: -1,
      created_at: -1,
    });
  });

  it("Should refuse an empty or too-long announcement", async () => {
    expect(
      (await call(adminAnnouncements, "POST", { title: " ", message: "Hi" }))
        .status
    ).toBe(400);
    expect(
      (
        await call(adminAnnouncements, "POST", {
          title: "Hi",
          message: "x".repeat(2001),
        })
      ).status
    ).toBe(400);
    expect(
      (await call(adminAnnouncements, "POST", { title: { $gt: "" } })).status
    ).toBe(400);
    expect(announcements.create).not.toHaveBeenCalled();
  });

  it("Should pin without marking it edited, and mark word changes as edited", async () => {
    await call(adminAnnouncement, "PATCH", { pinned: false }, {}, { id: ID });
    expect(announcements.findByIdAndUpdate).toHaveBeenLastCalledWith(ID, {
      pinned: false,
    });

    await call(
      adminAnnouncement,
      "PATCH",
      { title: "New", message: "Words" },
      {},
      { id: ID }
    );
    expect(announcements.findByIdAndUpdate).toHaveBeenLastCalledWith(ID, {
      title: "New",
      message: "Words",
      updated_at: expect.any(Date),
    });
  });

  it("Should say when the announcement doesn't exist", async () => {
    announcements.findByIdAndDelete.mockResolvedValue(null);
    expect(
      (await call(adminAnnouncement, "DELETE", undefined, {}, { id: ID }))
        .status
    ).toBe(404);
    expect(
      (await call(adminAnnouncement, "DELETE", undefined, {}, { id: "nope" }))
        .status
    ).toBe(404);
  });

  it("Should be for admins only on the website", async () => {
    (requireAdmin as jest.Mock).mockImplementation(forbidden);
    const res = await call(adminAnnouncements, "POST", {
      title: "Hi",
      message: "There",
    });
    expect(res.status).toBe(403);
    expect(announcements.create).not.toHaveBeenCalled();
  });

  it("Should accept an app admin's Bearer token, but not a GA's", async () => {
    const bearer = { Authorization: "Bearer token" };
    (getJWTPayload as jest.Mock).mockReturnValue({ id: "admin1" });
    members.findById.mockResolvedValue(ADMIN);
    const ok = await call(
      adminAnnouncements,
      "POST",
      { title: "Hi", message: "There" },
      bearer
    );
    expect(ok.status).toBe(201);
    expect(requireAdmin).not.toHaveBeenCalled();

    members.findById.mockResolvedValue({ _id: "ga1", role: "ga" });
    const ga = await call(
      adminAnnouncements,
      "POST",
      { title: "Hi", message: "There" },
      bearer
    );
    expect(ga.status).toBe(403);

    (getJWTPayload as jest.Mock).mockReturnValue(null);
    const badToken = await call(adminAnnouncements, "GET", undefined, bearer);
    expect(badToken.status).toBe(401);
    expect(announcements.create).toHaveBeenCalledTimes(1);
  });
});

describe("Announcements for members", () => {
  it("Should list them for active members", async () => {
    (requireActiveMember as jest.Mock).mockResolvedValue({ _id: "m1" });
    const res = await call(memberAnnouncements, "GET");
    expect(res.status).toBe(200);
    expect((res.body.announcements as unknown[]).length).toBe(1);
  });

  it("Should not list them for members who aren't active", async () => {
    (requireActiveMember as jest.Mock).mockImplementation(forbidden);
    const res = await call(memberAnnouncements, "GET");
    expect(res.status).toBe(403);
    expect(announcements.find).not.toHaveBeenCalled();
  });
});

describe("WhatsApp text", () => {
  it("Should put the title in bold, then the message", () => {
    expect(
      announcementShareText({ title: "Concert", message: "Saturday!" })
    ).toBe("*Concert*\n\nSaturday!");
  });
});
