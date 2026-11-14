import { format } from "date-fns";

import { monthlyAmountPence } from "@/src/lib/gocardless";
import { formatPence } from "@/src/lib/reportsShared";
import { isDateString, ukDate } from "@/src/lib/ukDate";

/* Join offers: a code (e.g. on a launch-night flyer) that gets a new monthly
member a cheaper first payment, then the normal monthly price from a set
date. Server only - the code itself must never reach the browser.

How it works, with nothing to remember to run later:
  1. sign-up (api/gocardless/mandateflow.ts) checks the code, saves
     `join_offer` on the member and puts the offer on the GoCardless mandate
     request (its metadata is copied onto the mandate)
  2. when the mandate is created, the webhook sees the offer on it and sets
     up a one-off first payment plus the normal subscription starting on the
     offer's date. GoCardless tells the member about both straight away.

The settings come from env, so the same code runs on the GoCardless sandbox
(dev) and live (main) - only the values differ:
  WALTON_LAUNCH_CODE                 the code on the flyer (any capitals)
  WALTON_LAUNCH_ENDS                 last day it can be used, YYYY-MM-DD (UK)
  WALTON_LAUNCH_SUBSCRIPTION_START   first full monthly payment, YYYY-MM-DD -
                                     every later one is on the same day of
                                     the month (so 1-28)
  WALTON_LAUNCH_FIRST_PAYMENT        first payment in pence (default 1000)
No code set = no offer. */

export type JoinOffer = {
  // Saved on the member and the mandate, e.g. "walton-launch"
  id: string;
  name: string;
  // Only for members choosing this home choir
  choir: string;
  code: string;
  endsOn: string;
  firstPaymentPence: number;
  subscriptionStart: string;
};

// A YYYY-MM-DD date a monthly GoCardless subscription can start on (GoCardless
// only collects on days 1-28)
const isSubscriptionStart = (value: string) =>
  isDateString(value) && Number(value.slice(8)) <= 28;

function waltonLaunch(): JoinOffer | null {
  const code = (process.env.WALTON_LAUNCH_CODE || "").trim();
  const endsOn = process.env.WALTON_LAUNCH_ENDS || "";
  const subscriptionStart = process.env.WALTON_LAUNCH_SUBSCRIPTION_START || "";
  if (!code || !isDateString(endsOn) || !isSubscriptionStart(subscriptionStart))
    return null;
  return {
    id: "walton-launch",
    name: "Walton launch night",
    // As saved in home_choir - choirName() in lib/venues.ts
    choir: "Walton on Thames",
    code,
    endsOn,
    firstPaymentPence: Number(process.env.WALTON_LAUNCH_FIRST_PAYMENT) || 1000,
    subscriptionStart,
  };
}

// Every offer that's set up (just one for now)
export const joinOffers = () =>
  [waltonLaunch()].filter((offer): offer is JoinOffer => offer !== null);

const tidyCode = (code: unknown) =>
  String(code || "")
    .trim()
    .toUpperCase();

/* Whether a code can be used: the offer, or the reason it can't. The home
choir is checked only when given (the form checks the code before they've
necessarily chosen one; the sign-up itself always checks it). */
export function checkOfferCode(
  code: unknown,
  homeChoir?: unknown,
  now = new Date()
): { offer: JoinOffer } | { message: string } {
  const offer = joinOffers().find((o) => tidyCode(o.code) === tidyCode(code));
  if (!offer) {
    return { message: "Sorry, that offer code isn't right - please check it" };
  }
  if (ukDate(now) > offer.endsOn) {
    return { message: "Sorry, that offer has ended" };
  }
  if (homeChoir !== undefined && homeChoir !== offer.choir) {
    return {
      message: `This offer is for ${offer.choir} - please choose it as your home choir`,
    };
  }
  return { offer };
}

// "2027-02-16" -> "16 February 2027" (midday, so no timezone can move the day)
const longDate = (date: string) =>
  format(new Date(`${date}T12:00:00Z`), "d MMMM yyyy");

// What they'll pay, for the sign-up form, e.g. "£10 to start, then £30 a
// month from 16 February 2027"
export const offerDescription = (offer: JoinOffer) =>
  `${formatPence(offer.firstPaymentPence)} to start, then ${formatPence(
    Number(monthlyAmountPence())
  )} a month from ${longDate(offer.subscriptionStart)}`;

// --- On the GoCardless mandate ---

// GoCardless allows 3 metadata keys on a mandate - all used here. The amounts
// travel with the mandate, so the webhook doesn't depend on the settings
// still being there when it runs.
const OFFER_KEY = "join_offer";
const FIRST_PAYMENT_KEY = "offer_first_pence";
const START_KEY = "offer_start";

export type MandateOffer = Pick<
  JoinOffer,
  "id" | "firstPaymentPence" | "subscriptionStart"
>;

export const offerMetadata = (offer: JoinOffer) => ({
  [OFFER_KEY]: offer.id,
  [FIRST_PAYMENT_KEY]: String(offer.firstPaymentPence),
  [START_KEY]: offer.subscriptionStart,
});

// The offer on a mandate, or null if it hasn't one (or it's not complete)
export function offerFromMetadata(
  metadata: Record<string, unknown> | undefined | null
): MandateOffer | null {
  const id = String(metadata?.[OFFER_KEY] || "");
  const firstPaymentPence = Number(metadata?.[FIRST_PAYMENT_KEY]);
  const subscriptionStart = String(metadata?.[START_KEY] || "");
  if (
    !id ||
    !(firstPaymentPence > 0) ||
    !isSubscriptionStart(subscriptionStart)
  )
    return null;
  return { id, firstPaymentPence, subscriptionStart };
}
