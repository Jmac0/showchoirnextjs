import {
  faCheckCircle,
  faEnvelope,
  faPen,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { format } from "date-fns";
import React, { useState } from "react";

import {
  DDMemberRow,
  INVITE_STATUS_LABELS,
  pounds,
} from "@/src/lib/ddMembersShared";

// Same button / input styles as the Music admin cards
const BUTTON =
  "flex items-center gap-2 rounded-md border border-lightGold/60 px-3 py-1.5 text-sm text-lightGold hover:bg-lightGold hover:text-black disabled:opacity-50";
const INPUT =
  "min-w-0 rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none";

const STATUS_STYLES = {
  not_sent: "border border-gray-400 text-gray-300",
  sent: "bg-yellow-600/30 text-lightGold",
  accepted: "bg-green-700/60 text-green-100",
};

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

type Props = {
  member: DDMemberRow;
  // The whole list, after a change here (the APIs return it)
  onMembers: (members: DDMemberRow[]) => void;
};

type Details = { first_name: string; last_name: string; email: string };
const EMPTY: Details = { first_name: "", last_name: "", email: "" };

// One existing Direct Debit member on the "DD members" admin page: their
// invite status, and buttons to send/resend the invite, correct their
// details, or add another singer their Direct Debit pays for.
export function DDMemberCard({ member, onMembers }: Props) {
  // Which form is open, if any
  const [form, setForm] = useState<"edit" | "singer" | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAccepted = member.invite_status === "accepted";
  const name = `${member.first_name} ${member.last_name}`;

  const openForm = (which: "edit" | "singer") => {
    setError("");
    setForm(which);
    setDetails(
      which === "edit"
        ? {
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
          }
        : // A new singer - often the same surname
          { ...EMPTY, last_name: member.last_name }
    );
  };

  // Runs a request; the API sends back the updated list
  const run = async (request: () => Promise<{ data: unknown }>) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      const result = data as {
        members: DDMemberRow[];
        failed?: { message: string }[];
      };
      onMembers(result.members);
      if (result.failed?.length) setError(result.failed[0].message);
      else setForm(null);
    } catch (err) {
      setError(errorMessage(err, "Something went wrong - please try again"));
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = () =>
    run(() =>
      axios.post("/api/admin/dd-members/send-invites", { ids: [member.id] })
    );

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    run(() =>
      form === "edit"
        ? axios.patch(`/api/admin/dd-members/${member.id}`, details)
        : axios.post(`/api/admin/dd-members/${member.id}/singers`, details)
    );
  };

  const field = (key: keyof Details, label: string) => (
    <label className="flex flex-1 flex-col text-sm text-gray-300">
      {label}
      <input
        className={INPUT}
        type={key === "email" ? "email" : "text"}
        value={details[key]}
        onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
        required
      />
    </label>
  );

  return (
    <article className="flex w-full flex-col gap-3 rounded-xl border-2 border-lightGold/70 bg-lightBlack/90 p-4">
      {/* --- Who, and where they're up to --- */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="p-0 text-lg font-bold text-white">{name}</h3>
          <p className="break-all text-sm text-gray-300">{member.email}</p>
          <p className="text-xs text-gray-400">
            {member.home_choir || "Home choir not chosen yet"}
          </p>
          {member.paid_by_name && (
            <p className="text-xs text-lightGold">
              On {member.paid_by_name}&apos;s Direct Debit
            </p>
          )}
          {member.mandate_status !== "active" && (
            <p className="text-xs text-red-300">
              Direct Debit not active (
              {member.mandate_status.replace(/_/g, " ") || "unknown"}) -
              can&apos;t be invited
            </p>
          )}
          {/* Joint membership: two singers on one Direct Debit */}
          {member.plan === "joint" && (
            <p className="text-xs text-lightGold">
              Joint membership ({pounds(member.amount)}) -{" "}
              {member.other_singers.length > 0
                ? `with ${member.other_singers.join(", ")}`
                : "add the second singer below"}
            </p>
          )}
          {member.plan === "other" && !member.paid_by_name && (
            <p className="text-xs text-lightGold">
              Pays {pounds(member.amount)} a month - not the single or joint
              price, please check in GoCardless
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              STATUS_STYLES[member.invite_status]
            }`}
          >
            {isAccepted && <FontAwesomeIcon icon={faCheckCircle} />}{" "}
            {INVITE_STATUS_LABELS[member.invite_status]}
          </span>
          {member.invite_status === "sent" && member.invite_sent_at && (
            <span className="text-xs text-gray-400">
              {format(new Date(member.invite_sent_at), "d MMM")}
              {member.invite_send_count > 1 &&
                ` · sent ${member.invite_send_count} times`}
            </span>
          )}
        </div>
      </div>

      {/* --- Actions (nothing to do once they've set up their account,
          apart from adding another singer on their Direct Debit) --- */}
      <div className="flex flex-wrap gap-2">
        {!isAccepted && (
          <>
            <button
              type="button"
              className={BUTTON}
              onClick={sendInvite}
              disabled={busy || !member.can_invite}
            >
              <FontAwesomeIcon icon={faEnvelope} />
              {member.invite_status === "sent"
                ? "Resend invite"
                : "Send invite"}
            </button>
            <button
              type="button"
              className={BUTTON}
              onClick={() => openForm("edit")}
              disabled={busy}
            >
              <FontAwesomeIcon icon={faPen} /> Edit details
            </button>
          </>
        )}
        {!member.paid_by_name && (
          <button
            type="button"
            className={BUTTON}
            onClick={() => openForm("singer")}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faUserPlus} /> Add a singer on this Direct
            Debit
          </button>
        )}
      </div>

      {/* --- Edit details / add a singer --- */}
      {form && (
        <form
          onSubmit={save}
          className="flex flex-col gap-3 rounded-lg bg-white/5 p-4"
        >
          <p className="text-sm text-gray-300">
            {form === "edit"
              ? "Correct their details before inviting them (changing the email means sending a new invite)."
              : `Another singer ${member.first_name}'s Direct Debit pays for. They get their own login and membership card.`}
          </p>
          <div className="flex flex-wrap gap-3">
            {field("first_name", "First name")}
            {field("last_name", "Last name")}
          </div>
          {field("email", "Email")}
          <div className="flex gap-3">
            <button type="submit" className={BUTTON} disabled={busy}>
              {form === "edit" ? "Save" : "Add singer"}
            </button>
            <button
              type="button"
              className={BUTTON}
              onClick={() => setForm(null)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </article>
  );
}
