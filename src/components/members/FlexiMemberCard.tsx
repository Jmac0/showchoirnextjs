import {
  faCheckCircle,
  faEnvelope,
  faHashtag,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { format } from "date-fns";
import React, { useState } from "react";

import { INVITE_STATUS_LABELS } from "@/src/lib/ddMembersShared";
import {
  FlexiMemberRow,
  MAX_CONFIRMED_SESSIONS,
  MIN_CONFIRMED_SESSIONS,
} from "@/src/lib/flexiMembersShared";

// Same button / input styles as the DD member cards
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
  member: FlexiMemberRow;
  // The whole list, after a change here (the APIs return it)
  onMembers: (members: FlexiMemberRow[]) => void;
};

type Details = { first_name: string; last_name: string; email: string };

// One existing Flexi member on the "Flexi members" admin page: their invite
// status and sessions, and buttons to send/resend the invite, correct their
// details, or enter their sessions from the paper records (normally the
// welcome desk does that the first time they're scanned).
export function FlexiMemberCard({ member, onMembers }: Props) {
  // Which form is open, if any
  const [form, setForm] = useState<"edit" | "sessions" | null>(null);
  const [details, setDetails] = useState<Details>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [sessions, setSessions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAccepted = member.invite_status === "accepted";
  const name = `${member.first_name} ${member.last_name}`.trim();

  const openForm = (which: "edit" | "sessions") => {
    setError("");
    setForm(which);
    setDetails({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
    });
    setSessions(member.sessions_confirmed ? String(member.flexi_sessions) : "");
  };

  // Runs a request; the API sends back the updated list
  const run = async (request: () => Promise<{ data: unknown }>) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      const result = data as {
        members: FlexiMemberRow[];
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
      axios.post("/api/admin/flexi-members/send-invites", { ids: [member.id] })
    );

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    run(() =>
      form === "edit"
        ? axios.patch(`/api/admin/flexi-members/${member.id}`, details)
        : axios.put(`/api/admin/flexi-members/${member.id}/sessions`, {
            sessions: Number(sessions),
          })
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
      {/* --- Who, their sessions, and where they're up to --- */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="p-0 text-lg font-bold text-white">{name || "?"}</h3>
          <p className="break-all text-sm text-gray-300">{member.email}</p>
          <p className="text-xs text-gray-400">
            {member.home_choir || "Home choir not chosen yet"}
          </p>
          {member.sessions_confirmed ? (
            <p className="text-xs text-green-300">
              {member.flexi_sessions} session
              {Math.abs(member.flexi_sessions) === 1 ? "" : "s"}
              {member.confirmed_note &&
                ` · confirmed by ${member.confirmed_note}`}
            </p>
          ) : (
            <p className="text-xs text-amber-300">
              Sessions to be confirmed - the desk enters them from the paper
              records when they&apos;re first scanned
              {member.flexi_sessions !== 0 &&
                ` (${member.flexi_sessions} bought online since will be added)`}
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

      {/* --- Actions --- */}
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
        <button
          type="button"
          className={BUTTON}
          onClick={() => openForm("sessions")}
          disabled={busy}
        >
          <FontAwesomeIcon icon={faHashtag} />
          {member.sessions_confirmed ? "Correct sessions" : "Enter sessions"}
        </button>
      </div>

      {/* --- Edit details / sessions --- */}
      {form && (
        <form
          onSubmit={save}
          className="flex flex-col gap-3 rounded-lg bg-white/5 p-4"
        >
          {form === "edit" ? (
            <>
              <p className="text-sm text-gray-300">
                Correct their details before inviting them (changing the email
                means sending a new invite).
              </p>
              <div className="flex flex-wrap gap-3">
                {field("first_name", "First name")}
                {field("last_name", "Last name")}
              </div>
              {field("email", "Email")}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300">
                {member.sessions_confirmed
                  ? "Their correct balance now (negative if they owe sessions)."
                  : "Sessions left on their paper record (negative if they owe some). Added to anything they've bought online since."}
              </p>
              <label className="flex flex-col text-sm text-gray-300">
                Sessions
                <input
                  className={`${INPUT} w-32`}
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={MIN_CONFIRMED_SESSIONS}
                  max={MAX_CONFIRMED_SESSIONS}
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          <div className="flex gap-3">
            <button type="submit" className={BUTTON} disabled={busy}>
              Save
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
