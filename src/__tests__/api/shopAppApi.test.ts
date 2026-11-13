/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, login, Contentful, storage or Stripe
jest.mock("../../lib/auth/requireActiveMember", () => ({
  requireActiveMember: jest.fn(),
}));
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/shopProduct", () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));
jest.mock("../../lib/models/shopOrder", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../../lib/contentfulClient", () => ({
  getChoirVenues: jest.fn().mockResolvedValue([
    { location: "Show Choir Banstead", order: 1 },
    { location: "Show Choir Dorking", order: 2 },
  ]),
}));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
  },
}));
jest.mock("../../lib/email/sendShopOrderEmails", () => ({
  sendShopOrderEmails: jest.fn(),
}));

/* eslint-disable import/first */
import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { sendShopOrderEmails } from "@/src/lib/email/sendShopOrderEmails";
import ShopOrders from "@/src/lib/models/shopOrder";
import ShopProducts from "@/src/lib/models/shopProduct";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import shopOrder from "@/src/pages/api/member-resources/shop-order";
import shopPaymentSheet from "@/src/pages/api/stripe/shop-payment-sheet";
/* eslint-enable import/first */

const HOODIE = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ORDER = "cccccccccccccccccccccccc";

const member = {
  _id: "member1",
  first_name: "Sam",
  last_name: "Singer",
  email: "sam@example.com",
};

const createPayment = stripe.paymentIntents.create as jest.Mock;
const retrievePayment = stripe.paymentIntents.retrieve as jest.Mock;
const orderSet = jest.fn();

type Handler = (req: NextApiRequest, res: NextApiResponse) => unknown;
const call = (
  handler: Handler,
  init: { method: string; body?: object },
  url = "/"
) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler,
      url,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: init.method,
          headers: { "Content-Type": "application/json" },
          body: init.body ? JSON.stringify(init.body) : undefined,
        });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

const basket = {
  // The price sent by the app is ignored - it comes from the database
  lines: [{ product_id: HOODIE, size: "M", quantity: 2, price_pence: 1 }],
  venue: "Banstead",
  note: " Name on the back: SAM ",
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_123";
  (requireActiveMember as jest.Mock).mockResolvedValue(member);
  (ShopProducts.find as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue([
      {
        _id: HOODIE,
        name: "Hoodie",
        price_pence: 3000,
        has_sizes: true,
        sizes: ["S", "M", "L"],
        visible: true,
        stripe_price_id: "price_hoodie",
      },
    ]),
  });
  (ShopOrders.create as jest.Mock).mockImplementation(async (values) => ({
    ...values,
    _id: ORDER,
    set: orderSet,
    save: jest.fn(),
  }));
  createPayment.mockResolvedValue({ id: "pi_1", client_secret: "pi_1_secret" });
});

describe("api/stripe/shop-payment-sheet", () => {
  it("stops when the member isn't logged in or active", async () => {
    (requireActiveMember as jest.Mock).mockImplementation(async (_q, res) => {
      res.status(403).json({ message: "Your membership isn't active" });
      return null;
    });
    const res = await call(shopPaymentSheet, { method: "POST", body: basket });
    expect(res.status).toBe(403);
    expect(ShopOrders.create).not.toHaveBeenCalled();
  });

  it("refuses a choir we don't deliver to", async () => {
    const res = await call(shopPaymentSheet, {
      method: "POST",
      body: { ...basket, venue: "Narnia" },
    });
    expect(res.status).toBe(400);
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("prices from the database and starts a shop payment for the sheet", async () => {
    const res = await call(shopPaymentSheet, { method: "POST", body: basket });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      clientSecret: "pi_1_secret",
      publishableKey: "pk_test_123",
      orderId: ORDER,
      reference: "CCCCCC",
      amountPence: 6000,
    });
    expect(ShopOrders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        venue: "Banstead",
        note: "Name on the back: SAM",
        total_pence: 6000,
      })
    );
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 6000,
        currency: "gbp",
        receipt_email: member.email,
        // what the webhook looks for to mark the order paid
        metadata: { kind: "shop", orderId: ORDER, user: member.email },
      })
    );
    expect(orderSet).toHaveBeenCalledWith("stripe_payment_intent", "pi_1");
  });
});

describe("api/member-resources/shop-order", () => {
  const pending = {
    _id: ORDER,
    member_id: "member1",
    status: "pending",
    stripe_payment_intent: "pi_1",
    items: [],
    total_pence: 6000,
    venue: "Banstead",
  };
  const lean = (value: unknown) => ({
    lean: jest.fn().mockResolvedValue(value),
  });

  it("only finds the member's own order", async () => {
    (ShopOrders.findOne as jest.Mock).mockReturnValue(lean(null));
    const res = await call(shopOrder, { method: "GET" }, `/?id=${ORDER}`);
    expect(res.status).toBe(404);
    expect(ShopOrders.findOne).toHaveBeenCalledWith({
      _id: ORDER,
      member_id: "member1",
    });
  });

  it("marks it paid when Stripe says the payment went through", async () => {
    (ShopOrders.findOne as jest.Mock).mockReturnValue(lean(pending));
    retrievePayment.mockResolvedValue({
      id: "pi_1",
      status: "succeeded",
      amount_received: 6000,
    });
    const paid = { ...pending, status: "paid", paid_at: new Date() };
    (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue(lean(paid));
    (ShopOrders.findById as jest.Mock).mockReturnValue(lean(paid));

    const res = await call(shopOrder, { method: "GET" }, `/?id=${ORDER}`);
    expect(res.status).toBe(200);
    expect(res.body.paid).toBe(true);
    expect(ShopOrders.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ORDER, status: "pending" },
      expect.objectContaining({
        status: "paid",
        stripe_payment_intent: "pi_1",
      }),
      { new: true }
    );
    expect(sendShopOrderEmails).toHaveBeenCalledTimes(1);
  });

  it("leaves it pending while the payment hasn't gone through", async () => {
    (ShopOrders.findOne as jest.Mock).mockReturnValue(lean(pending));
    retrievePayment.mockResolvedValue({ id: "pi_1", status: "processing" });
    (ShopOrders.findById as jest.Mock).mockReturnValue(lean(pending));

    const res = await call(shopOrder, { method: "GET" }, `/?id=${ORDER}`);
    expect(res.status).toBe(200);
    expect(res.body.paid).toBe(false);
    expect(ShopOrders.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
