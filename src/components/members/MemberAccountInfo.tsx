import axios from "axios";
import { useRouter } from "next/router";
import React, { useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import {
  FLEXI_PRODUCTS,
  FULL_PRICE_PRODUCT_ID,
} from "@/src/lib/stripe/flexiProducts";

type Props = {
  userData: {
    email?: string;
    flexi_sessions?: number;
    active_member?: boolean;
    active_mandate?: boolean;
    flexi_type?: string;
    membership_type?: string;
    first_name?: string;
  };
};

// Pre-select the option matching the pack they bought last time
// ("Flexi Concession" -> concession, anything else -> full price).
const defaultProductFor = (flexiType = "") =>
  /concession/i.test(flexiType) && !/non/i.test(flexiType)
    ? FLEXI_PRODUCTS[1].id
    : FULL_PRICE_PRODUCT_ID;

// Dashboard "Account" tab: membership details, and for anyone without an
// active Direct Debit, a way to buy another pack of 10 Flexi sessions online.
export function MemberAccountInfo({ userData = {} }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState(() =>
    defaultProductFor(userData.flexi_type)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessions = userData.flexi_sessions ?? 0;
  const selected = FLEXI_PRODUCTS.find((option) => option.id === product);
  // Direct Debit members with an active mandate don't need packs
  const canBuySessions = !userData.active_mandate;
  // Set by Stripe's return URLs (see api/stripe/checkout_flexi_topup.ts)
  const { topup } = router.query;

  // Closes the message by removing ?topup= from the address, so it also
  // doesn't come back when the page is refreshed to see the new sessions.
  // (shallow: just updates the address, doesn't reload the dashboard)
  const dismissTopupMessage = () => {
    const query = { ...router.query };
    delete query.topup;
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  // --- Buy a pack: get a Stripe Checkout page and go to it ---

  const buySessions = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post<{ sessionUrl: string }>(
        "/api/stripe/checkout_flexi_topup",
        { product }
      );
      // Leave the site for Stripe; they come back to this tab afterwards
      window.location.assign(data.sessionUrl);
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Something went wrong, please try again."
      );
      setLoading(false);
    }
  };

  return (
    // Scrolls itself, like MemberNotifications - the dashboard page around
    // it is fixed and doesn't scroll. The extra bottom padding keeps the Buy
    // now button clear of the screen edge (the dashboard's content area
    // starts 40px down, so its bottom sits just off screen).
    <section className="flex w-full flex-col items-center overflow-y-auto px-10 pb-24 pt-10 md:px-20">
      <h1>Member Account Info</h1>

      {/* --- Message after coming back from Stripe, with a ✕ to close it --- */}
      {(topup === "success" || topup === "cancelled") && (
        <div className="mb-6">
          <UserMessage
            showMessage
            isError={topup === "cancelled"}
            message={
              topup === "success"
                ? "Thank you, your payment went through! Your 10 sessions will be added in a moment - refresh this page to see them."
                : "Payment cancelled - you have not been charged."
            }
            onDismiss={dismissTopupMessage}
          />
        </div>
      )}

      {/* --- Account details --- */}
      <ul className="inner-shadow rounded-md bg-slate-600 p-16">
        <li>Membership type: {userData.membership_type}</li>
        {/* Sessions are shown to flexi members, and anyone who has some or
            owes some (e.g. after "pay later" at a rehearsal) */}
        {userData.membership_type === "flexi" || sessions !== 0 ? (
          <li>
            {sessions < 0
              ? `Flexi sessions owed: ${-sessions} (taken off your next pack)`
              : `Flexi sessions remaining: ${sessions}`}
          </li>
        ) : (
          ""
        )}
        <li>User email: {userData.email}</li>
      </ul>

      {/* --- Buy more sessions --- */}
      {canBuySessions && (
        <form
          onSubmit={buySessions}
          className="inner-shadow mt-8 flex w-full max-w-md flex-col rounded-md bg-slate-600 p-8"
        >
          <h2 className="mb-2 text-center">Get more Flexi sessions</h2>
          <p className="mb-4 text-center text-sm">
            A pack of 10 Flexi sessions, to use at any choir.
            {sessions < 0 &&
              ` The ${-sessions} you owe will be taken off, leaving ${
                10 + sessions
              }.`}
          </p>

          <label htmlFor="flexi-product" className="mb-1 text-sm">
            Concession (over 65s and registered disabled)
          </label>
          <select
            id="flexi-product"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            className="rounded py-2 pl-2 text-base text-black"
          >
            {FLEXI_PRODUCTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="mt-4 text-center text-xl">
            {`£${selected?.price} for 10 sessions`}
          </p>

          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <LoadingButton text="Buy now" loading={loading} disabled={false} />
        </form>
      )}
    </section>
  );
}
