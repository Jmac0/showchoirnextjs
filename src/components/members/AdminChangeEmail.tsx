import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";
const INPUT =
  "min-w-0 flex-1 rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none";

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// "Change a member's email" on the DD members admin page - for members who
// ask by email or phone. Any member (Flexi too). Changes it in our database,
// Mailchimp and GoCardless (if GoCardless has their old email) - see
// api/admin/change-email.ts. Members can also do it themselves from their
// Account page.
export function AdminChangeEmail({
  onChanged,
}: {
  // So the list below can show the new email straight away
  onChanged: (oldEmail: string, newEmail: string) => void;
}) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();

  const change = async (event: React.FormEvent) => {
    event.preventDefault();
    const from = currentEmail.trim().toLowerCase();
    const to = newEmail.trim().toLowerCase();
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Change ${from} to ${to}?`)) return;
    setBusy(true);
    setResult(undefined);
    try {
      const { data } = await axios.post("/api/admin/change-email", {
        current_email: from,
        new_email: to,
      });
      setResult({ ok: true, message: data.message });
      onChanged(from, to);
      setCurrentEmail("");
      setNewEmail("");
    } catch (err) {
      setResult({
        ok: false,
        message: errorMessage(err, "That didn't work - please try again"),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-lightGold bg-lightBlack/90 p-5 text-gray-300">
      <h2 className="text-lg font-bold text-lightGold">
        Change a member&apos;s email
      </h2>
      <p className="text-sm">
        Any member. Updates their login, Mailchimp and GoCardless (if GoCardless
        has their old email). Members can also do this themselves from their
        Account page.
      </p>
      <form className="flex flex-col gap-3" onSubmit={change}>
        <div className="flex flex-wrap gap-3">
          <input
            className={INPUT}
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            placeholder="Current email"
            aria-label="Current email"
            required
          />
          <input
            className={INPUT}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email"
            aria-label="New email"
            required
          />
        </div>
        <button
          type="submit"
          className={`${BIG_BUTTON} self-start`}
          disabled={busy || !currentEmail.trim() || !newEmail.trim()}
        >
          <FontAwesomeIcon icon={faEnvelope} /> Change email
        </button>
      </form>
      {result && (
        <p
          className={`text-sm ${result.ok ? "text-green-300" : "text-red-400"}`}
          role={result.ok ? "status" : "alert"}
        >
          {result.message}
        </p>
      )}
    </section>
  );
}
