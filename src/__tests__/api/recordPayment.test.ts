/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database or app login
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock("../../lib/auth/requireGA", () => ({ requireGA: jest.fn() }));
jest.mock("../../lib/checkins", () => ({
  ...jest.requireActual("../../lib/checkins"),
  createCheckin: jest.fn(),
}));

/* eslint-disable import/first */
import { requireGA } from "@/src/lib/auth/requireGA";
import { createCheckin } from "@/src/lib/checkins";
import Members from "@/src/lib/models/member";
import recordPayment from "@/src/pages/api/member-resources/record-payment";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const checkin = createCheckin as jest.Mock;

// Direct Debit stopped, no sessions - can't buy Flexi
const ddMember = {
  id: "m1",
  email: "dan@example.com",
  first_name: "Dan",
  last_name: "Debit",
  membership_type: "DD",
  flexi_sessions: 0,
};

const flexiMember = {
  ...ddMember,
  membership_type: "flexi",
  flexi_type: "Flexi Non Concession",
};

const post = (payment: string) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler: recordPayment,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: ddMember.email,
            venue: "choir-dorking-surrey",
            payment,
          }),
        });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  (requireGA as jest.Mock).mockResolvedValue({ id: "ga1" });
  members.findOne.mockResolvedValue(ddMember);
  checkin.mockResolvedValue({ id: "c1" });
});

describe("Desk payments - check in anyway", () => {
  it("Should check in a Direct Debit member as not paid, balance untouched", async () => {
    const { status, body } = await post("not_paid");
    expect(status).toBe(200);
    expect(body.status).toBe("not_paid");
    expect(checkin).toHaveBeenCalledWith(
      ddMember,
      "choir-dorking-surrey",
      "ga1",
      {
        payment: "not_paid",
      }
    );
    expect(members.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("Should say already checked in on a second go", async () => {
    checkin.mockResolvedValue(null);
    expect((await post("not_paid")).body.status).toBe("already_checked_in");
  });

  it("Should still not let a Direct Debit member pay at the desk", async () => {
    expect((await post("cash")).status).toBe(403);
    expect(checkin).not.toHaveBeenCalled();
  });

  it("Should not let a Flexi member in as not paid (they pay later)", async () => {
    members.findOne.mockResolvedValue(flexiMember);
    expect((await post("not_paid")).status).toBe(403);
    expect(checkin).not.toHaveBeenCalled();
  });
});
