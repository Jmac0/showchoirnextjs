import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faCircleExclamation,
  faEnvelope,
  faIdCard,
  faMasksTheater,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/router";
import React, { useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import { ChangeEmailForm } from "@/src/components/members/ChangeEmailForm";
import { ChangePasswordForm } from "@/src/components/members/ChangePasswordForm";
import { FlexiSessionsRing } from "@/src/components/members/FlexiSessionsRing";
import { UserMessage } from "@/src/components/UserMessage";
import type { DirectDebitNotice } from "@/src/lib/directDebit";
import type { FlexiExpiryNotice } from "@/src/lib/flexiExpiry";
import { canBuyFlexi, flexiProductFor } from "@/src/lib/stripe/flexiProducts";

type Props = {
  userData: {
    email?: string;
    flexi_sessions?: number;
    active_member?: boolean;
    active_mandate?: boolean;
    // Set if their Direct Debit has stopped (see lib/directDebit.ts)
    direct_debit?: DirectDebitNotice | null;
    flexi_type?: string;
    // Flexi: when their sessions expire, if within a month (lib/flexiExpiry.ts)
    flexi_expiry?: FlexiExpiryNotice | null;
    // When their Flexi sessions expired (membership_type "flexi_expired")
    flexi_expired_at?: string | null;
    membership_type?: string;
    first_name?: string;
  };
};

// Dark card with a gold border, used for both boxes on this tab
const CARD_CLASS =
  "flex w-full max-w-md flex-col rounded-xl border-2 border-lightGold bg-lightBlack/90 p-6 shadow-lg shadow-lightGold/10";

// "flexi" -> "Flexi", "DD" -> "Direct Debit" (as stored on the member)
const membershipLabel = (type = "") =>
  ({ flexi: "Flexi", DD: "Direct Debit", flexi_expired: "Flexi (expired)" }[
    type
  ] || type);

type DetailRowProps = {
  icon: IconDefinition;
  label: string;
  value: string | undefined;
  // Icon colour, gold unless set (e.g. green/amber for Direct Debit status)
  iconClassName?: string;
};

// One line of the membership card: gold icon, small label, value
function DetailRow({ icon, label, value, iconClassName }: DetailRowProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lightGold/50">
        <FontAwesomeIcon icon={icon} className={iconClassName} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </dt>
        <dd className="break-words text-base text-white">{value}</dd>
      </div>
    </div>
  );
}

DetailRow.defaultProps = {
  iconClassName: "text-lightGold",
};

// Dashboard "Account" tab: membership details, and for anyone without an
// active Direct Debit, a way to buy another pack of 10 Flexi sessions online.
export function MemberAccountInfo({ userData = {} }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // "Set up a new Direct Debit": waiting for GoCardless's link / what went wrong
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartError, setRestartError] = useState("");
  // Whether the "Get more Flexi sessions" card is open to show its form
  const [isBuyOpen, setIsBuyOpen] = useState(false);

  const sessions = userData.flexi_sessions ?? 0;
  // Their pack: existing concession members keep concession, everyone else
  // pays full price (the server picks the same one when they buy)
  const pack = flexiProductFor(userData);
  // Flexi is being phased out: only members who are on Flexi can buy more
  // packs (the server checks too - api/stripe/checkout_flexi_topup.ts).
  // Everyone else is offered Direct Debit.
  const canBuySessions = canBuyFlexi(userData);
  const ended = userData.direct_debit;
  // A Direct Debit member without an active Direct Debit - it stopped
  // (`ended`), or was never finished - gets the notice with a button to set up
  // a new one (their membership card is hidden then too)
  // "17 October"
  const day = (iso: string) => format(new Date(iso), "d MMMM");
  const flexiExpired = userData.membership_type === "flexi_expired";
  const needsDirectDebit =
    flexiExpired ||
    (userData.membership_type === "DD" &&
      (!!ended || !userData.active_mandate));
  // The notice's heading and message - why they need a Direct Debit
  let noticeTitle = "Your Direct Debit isn't set up";
  let noticeText =
    "Your membership isn't active because your Direct Debit isn't set up. Set it up now to get your membership card and start singing.";
  if (ended) {
    noticeTitle = "Your Direct Debit has stopped";
    noticeText = `Your Direct Debit was ${ended.what_happened} on ${day(
      ended.ended_at
    )}${ended.reason ? ` (${ended.reason})` : ""}. ${
      ended.in_grace_period
        ? `Your membership stays active until ${day(
            ended.grace_ends_at
          )} - set up a new Direct Debit before then to keep singing without a break.`
        : "Your membership is no longer active. Set up a new Direct Debit to keep singing."
    }`;
  }
  if (flexiExpired) {
    noticeTitle = "Your Flexi sessions have expired";
    noticeText = `Flexi sessions expire after 6 months without coming to a choir${
      userData.flexi_expired_at
        ? ` - yours expired on ${day(userData.flexi_expired_at)}`
        : ""
    }. Set up a monthly Direct Debit to keep singing - it covers every choir, any week.`;
  }
  // Flexi: their sessions expire within a month unless they come along
  const flexiWarning =
    userData.membership_type === "flexi" && userData.flexi_expiry?.in_warning
      ? userData.flexi_expiry
      : null;
  // The Direct Debit status line
  let directDebitStatus = userData.active_mandate ? "Active" : "Not active";
  // In the grace period after their Direct Debit stopped
  if (ended?.in_grace_period) {
    directDebitStatus = `Active until ${day(ended.grace_ends_at)}`;
  }
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

  // --- New Direct Debit: get GoCardless's form (details filled in) and go
  // to it - see api/gocardless/restart.ts ---

  const restartDirectDebit = async () => {
    setRestartError("");
    setIsRestarting(true);
    try {
      const { data } = await axios.post<{ authorisation_url: string }>(
        "/api/gocardless/restart"
      );
      // Leave the site for GoCardless; it brings them back afterwards
      window.location.assign(data.authorisation_url);
    } catch (err) {
      setRestartError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Something went wrong, please try again."
      );
      setIsRestarting(false);
    }
  };

  // --- Buy a pack: get a Stripe Checkout page and go to it ---

  const buySessions = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post<{ sessionUrl: string }>(
        "/api/stripe/checkout_flexi_topup"
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
      <h1 className="mb-6 text-center">Welcome {userData.first_name}</h1>

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

      {/* --- Warning: their Flexi sessions expire soon --- */}
      {flexiWarning && (
        <div
          role="status"
          className="mb-6 flex w-full max-w-md flex-col gap-2 rounded-xl border-2 border-amber-400 bg-lightBlack/90 p-5 text-gray-200"
        >
          <h2 className="flex items-center gap-3 p-0 text-lg text-amber-400">
            <FontAwesomeIcon icon={faCircleExclamation} />
            Your Flexi sessions expire soon
          </h2>
          <p className="text-sm">
            Flexi sessions expire after 6 months without coming to a choir. Your{" "}
            {sessions > 0 ? `${sessions} ` : ""}sessions expire on{" "}
            {day(flexiWarning.expires_at)} unless you come along before then.
          </p>
        </div>
      )}

      {/* --- Notice: their Direct Debit has stopped (or isn't set up), or
          their Flexi sessions have expired - with a button to set one up --- */}
      {needsDirectDebit && (
        <div
          role="status"
          className="mb-6 flex w-full max-w-md flex-col gap-3 rounded-xl border-2 border-amber-400 bg-lightBlack/90 p-5 text-gray-200"
        >
          <h2 className="flex items-center gap-3 p-0 text-lg text-amber-400">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {noticeTitle}
          </h2>
          <p className="text-sm">{noticeText}</p>
          <button
            type="button"
            onClick={restartDirectDebit}
            disabled={isRestarting}
            className="self-center rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white disabled:opacity-60"
          >
            {isRestarting
              ? "Just a moment..."
              : `Set up a ${flexiExpired ? "" : "new "}Direct Debit`}
          </button>
          {restartError && (
            <p role="alert" className="text-center text-sm text-red-400">
              {restartError}
            </p>
          )}
        </div>
      )}

      {/* --- Account details card --- */}
      <div className={CARD_CLASS}>
        <h2 className="mb-4 flex items-center justify-center gap-3 text-lightGold">
          <FontAwesomeIcon icon={faIdCard} />
          Your membership
        </h2>

        <dl className="flex flex-col gap-3">
          <DetailRow
            icon={faMasksTheater}
            label="Membership"
            value={membershipLabel(userData.membership_type)}
          />
          {/* Direct Debit status - flexi members pay per pack instead */}
          {userData.membership_type === "DD" && (
            <DetailRow
              icon={
                userData.active_mandate && !ended
                  ? faCircleCheck
                  : faCircleExclamation
              }
              iconClassName={
                userData.active_mandate && !ended
                  ? "text-green-400"
                  : "text-amber-400"
              }
              label="Status"
              value={directDebitStatus}
            />
          )}
          <DetailRow icon={faEnvelope} label="Email" value={userData.email} />
        </dl>

        {/* Sessions are shown to flexi members, and anyone who has some or
            owes some (e.g. after "pay later" at a rehearsal) */}
        {(userData.membership_type === "flexi" || sessions !== 0) && (
          <div className="mt-6 flex flex-col items-center border-t border-lightGold/30 pt-6">
            <FlexiSessionsRing remaining={sessions} />
            {sessions < 0 && (
              <span className="mt-2 text-sm text-gray-300">
                Taken off your next pack of 10
              </span>
            )}
          </div>
        )}
      </div>

      {/* --- Buy more sessions card ---
          Starts closed as a single button (like Change password), opens to
          the form, and has a Close link to fold it away again. */}
      {canBuySessions && !isBuyOpen && (
        <div className={`${CARD_CLASS} mt-8 items-center`}>
          <button
            type="button"
            onClick={() => setIsBuyOpen(true)}
            className="flex items-center justify-center gap-3 text-lg text-lightGold hover:text-white"
          >
            <FontAwesomeIcon icon={faTicket} />
            Get more Flexi sessions
          </button>
        </div>
      )}
      {canBuySessions && isBuyOpen && (
        <form onSubmit={buySessions} className={`${CARD_CLASS} mt-8`}>
          <h2 className="mb-2 flex items-center justify-center gap-3 text-lightGold">
            <FontAwesomeIcon icon={faTicket} />
            Get more Flexi sessions
          </h2>
          <p className="mb-5 text-center text-sm text-gray-300">
            A pack of 10 Flexi sessions, to use at any choir.
            {sessions < 0 &&
              ` The ${-sessions} you owe will be taken off, leaving ${
                10 + sessions
              }.`}
          </p>

          {/* Price - their own pack's price (concession or full) */}
          <p className="text-center">
            <span className="text-3xl font-bold text-lightGold">
              £{pack.price}
            </span>
            <span className="ml-2 text-gray-300">for 10 sessions</span>
          </p>
          {pack.id !== flexiProductFor({}).id && (
            <p className="mt-1 text-center text-xs text-gray-400">
              Concession price
            </p>
          )}

          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <LoadingButton text="Buy now" loading={loading} disabled={false} />

          <button
            type="button"
            onClick={() => {
              setError("");
              setIsBuyOpen(false);
            }}
            className="mt-4 self-center text-sm text-gray-400 underline hover:text-white"
          >
            Close
          </button>
        </form>
      )}

      {/* --- Change password card --- */}
      <ChangePasswordForm className={`${CARD_CLASS} mt-8 items-center`} />

      {/* --- Change email card --- */}
      <ChangeEmailForm className={`${CARD_CLASS} mt-8 items-center`} />
    </section>
  );
}
