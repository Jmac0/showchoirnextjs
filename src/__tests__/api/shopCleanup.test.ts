/** @jest-environment node */
// No real database or Stripe
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/shopOrder", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    deleteOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../../lib/models/shopProduct", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: {
    paymentIntents: { retrieve: jest.fn(), cancel: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn(), expire: jest.fn() } },
  },
}));
jest.mock("../../lib/email/sendShopOrderEmails", () => ({
  sendShopOrderEmails: jest.fn(),
}));
jest.mock("../../lib/contentfulClient", () => ({ getChoirVenues: jest.fn() }));

/* eslint-disable import/first */
import ShopOrders from "@/src/lib/models/shopOrder";
import { deleteAbandonedOrders } from "@/src/lib/shop";
import { stripe } from "@/src/lib/stripe/stripeSetup";
/* eslint-enable import/first */

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const C = "cccccccccccccccccccccccc";

const pending = (orders: object[]) =>
  (ShopOrders.find as jest.Mock).mockReturnValue({
    sort: () => ({
      limit: () => ({
        select: () => ({ lean: jest.fn().mockResolvedValue(orders) }),
      }),
    }),
  });
const retrievePI = stripe.paymentIntents.retrieve as jest.Mock;
const cancelPI = stripe.paymentIntents.cancel as jest.Mock;
const retrieveCheckout = stripe.checkout.sessions.retrieve as jest.Mock;
const expireCheckout = stripe.checkout.sessions.expire as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (ShopOrders.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
  (ShopOrders.findOneAndUpdate as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(null),
  });
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

const deletedIds = () =>
  (ShopOrders.deleteOne as jest.Mock).mock.calls.map((call) => call[0]._id);

describe("removing unpaid shop orders", () => {
  it("calls off an app payment in Stripe, then removes the order", async () => {
    pending([{ _id: A, stripe_payment_intent: "pi_a" }]);
    retrievePI.mockResolvedValue({
      id: "pi_a",
      status: "requires_payment_method",
    });
    cancelPI.mockResolvedValue({ id: "pi_a", status: "canceled" });
    await deleteAbandonedOrders();
    expect(cancelPI).toHaveBeenCalledWith("pi_a");
    expect(deletedIds()).toEqual([A]);
  });

  it("never removes one Stripe says was paid - marks it paid instead", async () => {
    pending([{ _id: A, stripe_payment_intent: "pi_a" }]);
    retrievePI.mockResolvedValue({
      id: "pi_a",
      status: "succeeded",
      amount_received: 3000,
    });
    await deleteAbandonedOrders();
    expect(cancelPI).not.toHaveBeenCalled();
    expect(ShopOrders.findOneAndUpdate).toHaveBeenCalled();
    expect(ShopOrders.deleteOne).not.toHaveBeenCalled();
  });

  it("removes one whose payment Stripe has never heard of (other account)", async () => {
    pending([{ _id: A, stripe_payment_intent: "pi_other" }]);
    retrievePI.mockRejectedValue(
      Object.assign(new Error("No such payment_intent"), {
        code: "resource_missing",
      })
    );
    await deleteAbandonedOrders();
    expect(deletedIds()).toEqual([A]);
  });

  it("keeps an order when Stripe can't be asked", async () => {
    pending([{ _id: A, stripe_payment_intent: "pi_a" }]);
    retrievePI.mockRejectedValue(new Error("Stripe is down"));
    await deleteAbandonedOrders();
    expect(ShopOrders.deleteOne).not.toHaveBeenCalled();
  });

  it("expires an open website checkout, and keeps a paid one", async () => {
    pending([
      { _id: A, stripe_session_id: "cs_a" },
      { _id: B, stripe_session_id: "cs_b" },
      { _id: C },
    ]);
    retrieveCheckout.mockImplementation(async (id: string) =>
      id === "cs_a"
        ? { id, status: "open" }
        : { id, status: "complete", payment_status: "paid", amount_total: 3000 }
    );
    expireCheckout.mockResolvedValue({ id: "cs_a", status: "expired" });
    await deleteAbandonedOrders();
    expect(expireCheckout).toHaveBeenCalledWith("cs_a");
    // A (expired) and C (never reached Stripe) go; B was paid
    expect(deletedIds()).toEqual([A, C]);
  });

  it("keeps them all if Stripe knows none of them (wrong key?)", async () => {
    pending([
      { _id: A, stripe_payment_intent: "pi_a" },
      { _id: B, stripe_payment_intent: "pi_b" },
      { _id: C, stripe_session_id: "cs_c" },
    ]);
    const missing = Object.assign(new Error("No such"), {
      code: "resource_missing",
    });
    retrievePI.mockRejectedValue(missing);
    retrieveCheckout.mockRejectedValue(missing);
    await deleteAbandonedOrders();
    expect(ShopOrders.deleteOne).not.toHaveBeenCalled();
  });
});
