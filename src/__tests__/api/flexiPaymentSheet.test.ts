/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, app login or Stripe
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../../lib/auth/verifyJWT", () => ({ getJWTPayload: jest.fn() }));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: {
    products: { retrieve: jest.fn() },
    prices: { retrieve: jest.fn() },
    paymentIntents: { create: jest.fn() },
  },
}));

/* eslint-disable import/first */
import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import Members from "@/src/lib/models/member";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import flexiPaymentSheet from "@/src/pages/api/stripe/flexi-payment-sheet";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const payload = getJWTPayload as jest.Mock;
const mockStripe = stripe as unknown as {
  products: { retrieve: jest.Mock };
  prices: { retrieve: jest.Mock };
  paymentIntents: { create: jest.Mock };
};

const flexiMember = {
  id: "m1",
  email: "ann@example.com",
  membership_type: "flexi",
  flexi_type: "Flexi Non Concession",
};

const post = () =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler: flexiPaymentSheet,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_123";
  // Logged in on the app as a Flexi member
  payload.mockReturnValue({ id: "m1" });
  members.findById.mockResolvedValue(flexiMember);
  mockStripe.products.retrieve.mockResolvedValue({
    id: "prod_full",
    name: "Flexi Non Concession",
    default_price: "price_full",
  });
  mockStripe.prices.retrieve.mockResolvedValue({
    unit_amount: 9500,
    currency: "gbp",
  });
  mockStripe.paymentIntents.create.mockResolvedValue({
    client_secret: "pi_123_secret_abc",
  });
});

describe("App Flexi payment sheet", () => {
  it("Should need them to be logged in on the app", async () => {
    payload.mockReturnValue(null);
    expect((await post()).status).toBe(401);
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("Should only let Flexi members buy a pack", async () => {
    members.findById.mockResolvedValue({
      ...flexiMember,
      membership_type: "DD",
    });
    expect((await post()).status).toBe(403);
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("Should start a payment the webhook will recognise, at Stripe's price", async () => {
    const { status, body } = await post();

    expect(status).toBe(200);
    expect(body).toEqual({
      clientSecret: "pi_123_secret_abc",
      publishableKey: "pk_test_123",
      amountPence: 9500,
    });
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 9500,
        currency: "gbp",
        receipt_email: "ann@example.com",
        // What api/stripe/webhooks.ts reads to add the 10 sessions
        metadata: {
          orderItems: "Flexi Non Concession",
          user: "ann@example.com",
        },
      })
    );
  });

  it("Should say payments aren't available if the publishable key isn't set", async () => {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
    expect((await post()).status).toBe(500);
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });
});
