/** @jest-environment node */
import bcrypt from "bcrypt";
import { testApiHandler } from "next-test-api-route-handler";

// No real database, login, Mailchimp or emails
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn(), deleteOne: jest.fn() },
}));
jest.mock("../../lib/models/checkin", () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../../lib/mailchimp", () => ({ archiveContact: jest.fn() }));
jest.mock("../../lib/email/sendAccountDeletedEmail", () => ({
  sendAccountDeletedEmail: jest.fn(),
}));

/* eslint-disable import/first */
import { sendAccountDeletedEmail } from "@/src/lib/email/sendAccountDeletedEmail";
import { archiveContact } from "@/src/lib/mailchimp";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import deleteAccount from "@/src/pages/api/members/delete-account";
/* eslint-enable import/first */

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const { getServerSession } = require("next-auth/next");

const members = Members as unknown as Record<string, jest.Mock>;
const checkins = Checkins as unknown as Record<string, jest.Mock>;
const member = {
  id: "m1",
  email: "ann@example.com",
  first_name: "Ann",
  last_name: "Singer",
  password: bcrypt.hashSync("secret", 4),
};

const post = (body: object) =>
  new Promise<number>((resolve) => {
    testApiHandler({
      handler: deleteAccount,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        resolve(res.status);
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  // Logged in on the website
  getServerSession.mockResolvedValue({ user: { email: "ann@example.com" } });
  members.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(member),
  });
});

describe("Delete my account", () => {
  it("Should need the right password, and delete nothing otherwise", async () => {
    expect(await post({ currentPassword: "wrong" })).toBe(400);
    expect(await post({})).toBe(400);
    expect(members.deleteOne).not.toHaveBeenCalled();
    expect(checkins.deleteMany).not.toHaveBeenCalled();
  });

  it("Should need them to be logged in", async () => {
    getServerSession.mockResolvedValue(null);
    expect(await post({ currentPassword: "secret" })).toBe(401);
    expect(members.deleteOne).not.toHaveBeenCalled();
  });

  it("Should delete their record and check-ins, archive them in Mailchimp and tell the admin", async () => {
    expect(await post({ currentPassword: "secret" })).toBe(200);
    expect(checkins.deleteMany).toHaveBeenCalledWith({ member_id: "m1" });
    expect(members.deleteOne).toHaveBeenCalledWith({ _id: "m1" });
    expect(archiveContact).toHaveBeenCalledWith("ann@example.com");
    expect(sendAccountDeletedEmail).toHaveBeenCalledWith(member);
  });

  it("Should still delete the account if the admin email fails", async () => {
    (sendAccountDeletedEmail as jest.Mock).mockRejectedValue(
      new Error("Resend is down")
    );
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await post({ currentPassword: "secret" })).toBe(200);
    expect(members.deleteOne).toHaveBeenCalled();
  });
});
