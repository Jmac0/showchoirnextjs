/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";
import crypto from "node:crypto";

// No real database or GoCardless
jest.mock("../../lib/dbConnect", () => jest.fn());
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
  isDuplicateEmailError: () => false,
}));
jest.mock("../../lib/models/goCardlessEventLog", () => ({
  __esModule: true,
  default: { exists: jest.fn(), create: jest.fn() },
}));
jest.mock("../../lib/gocardless", () => {
  const client = {
    mandates: { find: jest.fn() },
    payments: { create: jest.fn() },
    subscriptions: { create: jest.fn() },
  };
  return {
    goCardlessClient: () => client,
    directDebitFormUrl: jest.fn(),
    MEMBER_ID_KEY: "member_id",
    monthlyAmountPence: () => "3000",
  };
});

/* eslint-disable import/first */
import { directDebitFormUrl, goCardlessClient } from "@/src/lib/gocardless";
import {
  checkOfferCode,
  offerDescription,
  offerFromMetadata,
  offerMetadata,
} from "@/src/lib/joinOffers";
import GoCardlessEventLog from "@/src/lib/models/goCardlessEventLog";
import Members from "@/src/lib/models/member";
import mandateFlow from "@/src/pages/api/gocardless/mandateflow";
import webhooks, { config } from "@/src/pages/api/gocardless/webhooks";
/* eslint-enable import/first */

const members = Members as unknown as Record<string, jest.Mock>;
const eventLog = GoCardlessEventLog as unknown as Record<string, jest.Mock>;
const formUrl = directDebitFormUrl as jest.Mock;
const gc = goCardlessClient() as unknown as Record<
  string,
  Record<string, jest.Mock>
>;

const WALTON = "Walton on Thames";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.WALTON_LAUNCH_CODE = "Launch27";
  process.env.WALTON_LAUNCH_ENDS = "2027-01-26";
  process.env.WALTON_LAUNCH_SUBSCRIPTION_START = "2027-02-16";
  delete process.env.WALTON_LAUNCH_FIRST_PAYMENT;
});

describe("checkOfferCode", () => {
  const launchNight = new Date("2027-01-19T21:00:00Z");

  it("Should accept the code in any capitals, for Walton", () => {
    const check = checkOfferCode(" launch27 ", WALTON, launchNight);
    expect(check).toMatchObject({
      offer: {
        id: "walton-launch",
        firstPaymentPence: 1000,
        subscriptionStart: "2027-02-16",
      },
    });
  });

  it("Should turn away a wrong code", () => {
    expect(checkOfferCode("NOPE", WALTON, launchNight)).toHaveProperty(
      "message"
    );
  });

  it("Should work all of the last day, UK time, and not after", () => {
    expect(
      checkOfferCode("LAUNCH27", WALTON, new Date("2027-01-26T23:59:00Z"))
    ).toHaveProperty("offer");
    expect(
      checkOfferCode("LAUNCH27", WALTON, new Date("2027-01-27T00:01:00Z"))
    ).toEqual({ message: "Sorry, that offer has ended" });
  });

  it("Should only be for Walton members", () => {
    expect(checkOfferCode("LAUNCH27", "Dorking", launchNight)).toHaveProperty(
      "message"
    );
    // ...but the choir isn't checked when it isn't given (the form's check)
    expect(checkOfferCode("LAUNCH27", undefined, launchNight)).toHaveProperty(
      "offer"
    );
  });

  it("Should be off when the code isn't set, or a date is wrong", () => {
    delete process.env.WALTON_LAUNCH_CODE;
    expect(checkOfferCode("", WALTON, launchNight)).toHaveProperty("message");
    process.env.WALTON_LAUNCH_CODE = "LAUNCH27";
    // GoCardless only collects on days 1-28
    process.env.WALTON_LAUNCH_SUBSCRIPTION_START = "2027-02-30";
    expect(checkOfferCode("LAUNCH27", WALTON, launchNight)).toHaveProperty(
      "message"
    );
  });

  it("Should describe what they'll pay", () => {
    const check = checkOfferCode("LAUNCH27", WALTON, launchNight);
    if (!("offer" in check)) throw new Error("expected the offer");
    expect(offerDescription(check.offer)).toBe(
      "£10 to start, then £30 a month from 16 February 2027"
    );
  });

  it("Should read the offer back from the mandate's metadata", () => {
    const check = checkOfferCode("LAUNCH27", WALTON, launchNight);
    if (!("offer" in check)) throw new Error("expected the offer");
    expect(offerFromMetadata(offerMetadata(check.offer))).toEqual({
      id: "walton-launch",
      firstPaymentPence: 1000,
      subscriptionStart: "2027-02-16",
    });
    expect(offerFromMetadata({})).toBeNull();
    expect(offerFromMetadata(undefined)).toBeNull();
  });
});

// --- Sign-up ---

const signUp = (body: object) =>
  new Promise<{ status: number; json: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler: mandateFlow,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        resolve({ status: res.status, json: await res.json() });
      },
    });
  });

const form = {
  firstName: "Ann",
  lastName: "Smith",
  email: "ann@example.com",
  homeChoir: WALTON,
};

describe("Monthly sign-up with an offer code", () => {
  beforeEach(() => {
    // Still open whenever the tests run (they use the real clock)
    process.env.WALTON_LAUNCH_ENDS = "2999-12-31";
    members.findOne.mockReturnValue({ select: () => Promise.resolve(null) });
    members.create.mockResolvedValue({ id: "M1" });
    formUrl.mockResolvedValue("https://pay.gocardless.test/flow");
  });

  it("Should save the offer on the member and pass it to GoCardless", async () => {
    const { status } = await signUp({ ...form, offerCode: "launch27" });
    expect(status).toBe(200);
    expect(members.create).toHaveBeenCalledWith(
      expect.objectContaining({
        join_offer: expect.objectContaining({ offer: "walton-launch" }),
      })
    );
    expect(formUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        mandateMetadata: {
          join_offer: "walton-launch",
          offer_first_pence: "1000",
          offer_start: "2027-02-16",
        },
      })
    );
  });

  it("Should turn away a wrong code instead of charging the full price", async () => {
    const { status, json } = await signUp({ ...form, offerCode: "WRONG" });
    expect(status).toBe(400);
    expect(json.message).toMatch(/isn't right/);
    expect(members.create).not.toHaveBeenCalled();
    expect(formUrl).not.toHaveBeenCalled();
  });

  it("Should be a normal sign-up without a code", async () => {
    await signUp(form);
    expect(members.create.mock.calls[0][0]).not.toHaveProperty("join_offer");
    expect(formUrl.mock.calls[0][0]).not.toHaveProperty("mandateMetadata");
  });
});

// --- The webhook, when the mandate is created ---

const SECRET = "test-webhook-secret";
process.env.GO_CARDLESS_WEBHOOK_SECRET = SECRET;

const sendEvents = (events: object[]) =>
  new Promise<number>((resolve) => {
    const body = JSON.stringify({ events });
    testApiHandler({
      handler: Object.assign(webhooks, { config }),
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Webhook-Signature": crypto
              .createHmac("sha256", SECRET)
              .update(body)
              .digest("hex"),
          },
          body,
        });
        resolve(res.status);
      },
    });
  });

const mandateCreated = {
  id: "EV9",
  resource_type: "mandates",
  action: "created",
  links: { mandate: "MD9" },
};

describe("GoCardless webhook - starting the payments", () => {
  beforeEach(() => {
    eventLog.exists.mockResolvedValue(null);
  });

  it("Should take the offer's first payment and start £30 on its date", async () => {
    gc.mandates.find.mockResolvedValue({
      id: "MD9",
      next_possible_charge_date: "2027-01-25",
      metadata: {
        join_offer: "walton-launch",
        offer_first_pence: "1000",
        offer_start: "2027-02-16",
      },
    });
    expect(await sendEvents([mandateCreated])).toBe(200);

    expect(gc.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "1000",
        currency: "GBP",
        links: { mandate: "MD9" },
      }),
      "offer-payment-EV9"
    );
    expect(gc.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "3000",
        day_of_month: "16",
        start_date: "2027-02-16",
      }),
      "subscription-EV9"
    );
  });

  it("Should still bill on the 16th if the start date is too soon", async () => {
    gc.mandates.find.mockResolvedValue({
      id: "MD9",
      next_possible_charge_date: "2027-02-20",
      metadata: {
        join_offer: "walton-launch",
        offer_first_pence: "1000",
        offer_start: "2027-02-16",
      },
    });
    await sendEvents([mandateCreated]);
    const [subscription] = gc.subscriptions.create.mock.calls[0];
    expect(subscription.day_of_month).toBe("16");
    expect(subscription).not.toHaveProperty("start_date");
  });

  it("Should be the normal £30 on the 1st without an offer", async () => {
    gc.mandates.find.mockResolvedValue({ id: "MD9", metadata: {} });
    await sendEvents([mandateCreated]);
    expect(gc.payments.create).not.toHaveBeenCalled();
    const [subscription] = gc.subscriptions.create.mock.calls[0];
    expect(subscription).toMatchObject({ amount: "3000", day_of_month: "1" });
    expect(subscription).not.toHaveProperty("start_date");
  });
});
