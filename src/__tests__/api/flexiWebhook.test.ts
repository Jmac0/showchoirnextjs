/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, Stripe, email or Mailchimp
jest.mock("micro", () => ({ buffer: jest.fn().mockResolvedValue("raw") }));
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: { webhooks: { constructEvent: jest.fn() } },
}));
jest.mock("../../lib/models/stripeEventLogSchema", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    exists: jest.fn(),
  },
}));
jest.mock("../../lib/email/sendWelcomeEmail", () => ({
  sendWelcomeEmail: jest.fn(),
}));
jest.mock("../../lib/memberAudience", () => ({ memberJoined: jest.fn() }));
jest.mock("../../lib/metaMemberEvents", () => ({
  tellMetaMemberJoined: jest.fn(),
}));

/* eslint-disable import/first */
import { memberJoined } from "@/src/lib/memberAudience";
import Members from "@/src/lib/models/member";
import StripeEventLog from "@/src/lib/models/stripeEventLogSchema";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import webhooks from "@/src/pages/api/stripe/webhooks";
/* eslint-enable import/first */

const MEMBER = "aaaaaaaaaaaaaaaaaaaaaaaa";

const flexiEvent = (metadata: Record<string, string>) => ({
  id: "evt_flexi_1",
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_flexi_1",
      amount: 6000,
      amount_received: 6000,
      metadata: { orderItems: "Flexi Non Concession", ...metadata },
    },
  },
});

const send = () =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler: webhooks,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: "raw" });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

const update = Members.findOneAndUpdate as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (StripeEventLog.findOne as jest.Mock).mockResolvedValue(null);
});

describe("Stripe webhook: Flexi packs", () => {
  it("adds the sessions to the member by id, once per payment", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
      flexiEvent({ user: "old@example.com", memberId: MEMBER })
    );
    update.mockResolvedValue({ id: MEMBER, date_joined: "01-01-2026" });

    const res = await send();
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      {
        _id: MEMBER,
        "topUpDate.stripe_payment_intent": { $ne: "pi_flexi_1" },
      },
      expect.objectContaining({ $inc: { flexi_sessions: 10 } }),
      { new: true }
    );
    expect(memberJoined).toHaveBeenCalledTimes(1);
  });

  it("falls back to the email for payments made before the member id", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
      flexiEvent({ user: "ann@example.com" })
    );
    update.mockResolvedValue({ id: MEMBER, date_joined: "01-01-2026" });

    await send();
    expect(update.mock.calls[0][0]).toEqual({
      email: "ann@example.com",
      "topUpDate.stripe_payment_intent": { $ne: "pi_flexi_1" },
    });
  });

  it("a second copy arriving at the same time adds nothing", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
      flexiEvent({ user: "ann@example.com", memberId: MEMBER })
    );
    // The first copy has already added this payment's sessions
    update.mockResolvedValue(null);
    (Members.exists as jest.Mock).mockResolvedValue({ _id: MEMBER });

    const res = await send();
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(memberJoined).not.toHaveBeenCalled();
    expect(StripeEventLog.create).not.toHaveBeenCalled();
  });
});
