/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, Stripe or email
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
  default: { findOneAndUpdate: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../../lib/models/shopOrder", () => ({
  __esModule: true,
  default: { findOneAndUpdate: jest.fn(), exists: jest.fn() },
}));
jest.mock("../../lib/email/sendShopOrderEmails", () => ({
  sendShopOrderEmails: jest.fn(),
}));
jest.mock("../../lib/email/sendWelcomeEmail", () => ({
  sendWelcomeEmail: jest.fn(),
}));
jest.mock("../../lib/memberAudience", () => ({ memberJoined: jest.fn() }));
jest.mock("../../lib/metaMemberEvents", () => ({
  tellMetaMemberJoined: jest.fn(),
}));

/* eslint-disable import/first */
import { sendShopOrderEmails } from "@/src/lib/email/sendShopOrderEmails";
import Members from "@/src/lib/models/member";
import ShopOrders from "@/src/lib/models/shopOrder";
import StripeEventLog from "@/src/lib/models/stripeEventLogSchema";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import webhooks from "@/src/pages/api/stripe/webhooks";
/* eslint-enable import/first */

const ORDER = "cccccccccccccccccccccccc";

const shopEvent = {
  id: "evt_shop_1",
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_1",
      amount: 6850,
      amount_received: 6850,
      metadata: { kind: "shop", orderId: ORDER, user: "sam@example.com" },
    },
  },
};

const paidOrder = {
  _id: ORDER,
  member: { first_name: "Sam", last_name: "Singer", email: "sam@example.com" },
  items: [
    {
      product_id: "p1",
      name: "Hoodie",
      size: "M",
      quantity: 2,
      unit_pence: 3000,
    },
  ],
  venue: "Banstead",
  note: "",
  total_pence: 6000,
  fulfilment: "new",
  paid_at: new Date("2026-11-11T10:00:00Z"),
};

const send = () =>
  new Promise<number>((resolve) => {
    testApiHandler({
      handler: webhooks,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", body: "raw" });
        resolve(res.status);
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(shopEvent);
  (StripeEventLog.findOne as jest.Mock).mockResolvedValue(null);
  (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(paidOrder),
  });
});

describe("Stripe webhook - kit shop", () => {
  it("Should mark a pending order paid and send the emails", async () => {
    expect(await send()).toBe(200);
    expect(ShopOrders.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ORDER, status: "pending" },
      expect.objectContaining({
        status: "paid",
        stripe_payment_intent: "pi_1",
        amount_paid_pence: 6850,
      }),
      { new: true }
    );
    expect(sendShopOrderEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "CCCCCC",
        member_email: "sam@example.com",
        venue: "Banstead",
      })
    );
    expect(StripeEventLog.create).toHaveBeenCalledWith({
      stripeEvent: "evt_shop_1",
    });
    // Not mistaken for a Flexi payment
    expect(Members.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("Should not email again when the order is already paid", async () => {
    (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    (ShopOrders.exists as jest.Mock).mockResolvedValue({ _id: ORDER });
    expect(await send()).toBe(200);
    expect(sendShopOrderEmails).not.toHaveBeenCalled();
  });

  it("Should shout (not fail) when a payment arrives for an order that's gone", async () => {
    (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    (ShopOrders.exists as jest.Mock).mockResolvedValue(null);
    const error = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(await send()).toBe(200);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("for a missing order")
    );
    error.mockRestore();
  });

  it("Should ignore an event it has already dealt with", async () => {
    (StripeEventLog.findOne as jest.Mock).mockResolvedValue({ id: "x" });
    expect(await send()).toBe(200);
    expect(ShopOrders.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("Should still save the order if the email fails", async () => {
    (sendShopOrderEmails as jest.Mock).mockRejectedValue(new Error("down"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await send()).toBe(200);
    expect(StripeEventLog.create).toHaveBeenCalled();
  });

  it("Should ask Stripe to retry if the database fails", async () => {
    (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("db down")),
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await send()).toBe(500);
    expect(StripeEventLog.create).not.toHaveBeenCalled();
  });

  it("Should still treat Flexi payments as before", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_flexi",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_2",
          amount: 5000,
          metadata: { orderItems: "Flexi Non Concession", user: "a@b.com" },
        },
      },
    });
    (Members.findOneAndUpdate as jest.Mock).mockResolvedValue({
      id: "m1",
      date_joined: "01-01-2026",
    });
    expect(await send()).toBe(200);
    expect(Members.findOneAndUpdate).toHaveBeenCalled();
    expect(ShopOrders.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
