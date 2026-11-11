/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, login, Contentful or Stripe
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));
jest.mock("../../lib/models/shopProduct", () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));
jest.mock("../../lib/models/shopOrder", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));
jest.mock("../../lib/contentfulClient", () => ({
  getChoirVenues: jest.fn().mockResolvedValue([
    { location: "Show Choir Banstead", order: 1 },
    { location: "Show Choir Dorking", order: 2 },
  ]),
}));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));
jest.mock("../../lib/email/sendShopOrderEmails", () => ({
  sendShopOrderEmails: jest.fn(),
}));

/* eslint-disable import/first */
import { getServerSession } from "next-auth/next";

import Members from "@/src/lib/models/member";
import ShopOrders from "@/src/lib/models/shopOrder";
import ShopProducts from "@/src/lib/models/shopProduct";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import shopCheckout from "@/src/pages/api/shop/checkout";
/* eslint-enable import/first */

const HOODIE = "aaaaaaaaaaaaaaaaaaaaaaaa";
const BOTTLE = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ORDER = "cccccccccccccccccccccccc";

// An active Direct Debit member
const member = {
  _id: "member1",
  first_name: "Sam",
  last_name: "Singer",
  email: "sam@example.com",
  membership_type: "DD",
  active_mandate: true,
};

const save = jest.fn();
const createSession = stripe.checkout.sessions.create as jest.Mock;

const post = (body: object) =>
  new Promise<{ status: number; body: Record<string, string> }>((resolve) => {
    testApiHandler({
      handler: shopCheckout,
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

const basket = {
  lines: [
    { product_id: HOODIE, size: "M", quantity: 2 },
    { product_id: HOODIE, size: "L", quantity: 1 },
    { product_id: BOTTLE, size: "", quantity: 1 },
  ],
  venue: "Banstead",
  note: " Name on the back: SAM ",
};

beforeEach(() => {
  jest.clearAllMocks();
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { email: member.email },
  });
  (Members.findOne as jest.Mock).mockResolvedValue(member);
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
      {
        _id: BOTTLE,
        name: "Water bottle",
        price_pence: 850,
        has_sizes: false,
        sizes: [],
        visible: true,
        stripe_price_id: "price_bottle",
      },
    ]),
  });
  (ShopOrders.create as jest.Mock).mockImplementation(async (values) => ({
    ...values,
    _id: ORDER,
    set: jest.fn(),
    save,
  }));
  createSession.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/pay/cs_test_1",
  });
});

describe("Shop checkout", () => {
  it("Should need a login", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await post(basket)).status).toBe(401);
  });

  it("Should turn away members whose membership isn't active", async () => {
    (Members.findOne as jest.Mock).mockResolvedValue({
      ...member,
      membership_type: "flexi_expired",
      flexi_expired: true,
    });
    expect((await post(basket)).status).toBe(403);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("Should need one of our choirs to deliver to", async () => {
    const res = await post({ ...basket, venue: "Timbuktu" });
    expect(res.status).toBe(400);
    expect(ShopOrders.create).not.toHaveBeenCalled();
  });

  it("Should save the order priced from the products and send them to Stripe", async () => {
    const res = await post({
      ...basket,
      // Prices sent by the browser are ignored
      lines: basket.lines.map((line) => ({ ...line, unit_pence: 1 })),
    });
    expect(res.status).toBe(200);
    expect(res.body.sessionUrl).toBe(
      "https://checkout.stripe.com/pay/cs_test_1"
    );

    expect(ShopOrders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        member_id: "member1",
        member: {
          first_name: "Sam",
          last_name: "Singer",
          email: "sam@example.com",
        },
        venue: "Banstead",
        note: "Name on the back: SAM",
        total_pence: 3000 * 3 + 850,
      })
    );
    const { items } = (ShopOrders.create as jest.Mock).mock.calls[0][0];
    expect(
      items.map((i: Record<string, unknown>) => [i.name, i.size, i.quantity])
    ).toEqual([
      ["Hoodie", "M", 2],
      ["Hoodie", "L", 1],
      ["Water bottle", "", 1],
    ]);

    // One Stripe line per product (sizes are in our order)
    const session = createSession.mock.calls[0][0];
    expect(session.line_items).toEqual([
      { price: "price_hoodie", quantity: 3 },
      { price: "price_bottle", quantity: 1 },
    ]);
    expect(session.customer_email).toBe("sam@example.com");
    expect(session.payment_intent_data.metadata).toEqual({
      kind: "shop",
      orderId: ORDER,
      user: "sam@example.com",
    });
    expect(session.success_url).toContain(`/members/shop?order=${ORDER}`);
    expect(save).toHaveBeenCalled();
  });

  it("Should say what's wrong with the basket", async () => {
    const res = await post({
      ...basket,
      lines: [{ product_id: HOODIE, size: "", quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Please choose a size for the Hoodie");
    expect(createSession).not.toHaveBeenCalled();
  });
});
