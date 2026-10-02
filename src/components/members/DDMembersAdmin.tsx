import {
  faCloudDownloadAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import { DDMemberCard } from "@/src/components/members/DDMemberCard";
import {
  DDMemberRow,
  ImportSummary,
  InviteStatus,
  MAX_INVITES_PER_REQUEST,
} from "@/src/lib/ddMembersShared";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";

type Tab = InviteStatus | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Invite sent" },
  { value: "accepted", label: "Account created" },
  { value: "all", label: "All" },
];

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// The "DD members" admin page's contents - getting existing Direct Debit
// members (who used to sign in on paper) set up with accounts:
//   1. Import from GoCardless - creates a member for each paying customer
//   2. Check details / add extra singers on shared Direct Debits
//   3. Send the invites - each member gets an email with a link to finish
//      setting up their account (pages/register/welcome.tsx)
// Then watch them move to "Account created".
export function DDMembersAdmin({
  initialMembers,
}: {
  initialMembers: DDMemberRow[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [tab, setTab] = useState<Tab>("not_sent");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  // Sending everyone: how far through, and anyone it couldn't email
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [failures, setFailures] = useState<string[]>([]);

  // Not invited yet, and their Direct Debit is active
  const invitable = members.filter(
    (m) => m.invite_status === "not_sent" && m.can_invite
  );

  const count = (value: Tab) =>
    value === "all"
      ? members.length
      : members.filter((m) => m.invite_status === value).length;

  // --- 1. Import ---

  const importMembers = async () => {
    setBusy(true);
    setError("");
    setSummary(null);
    try {
      const { data } = await axios.post("/api/admin/dd-members/import");
      setMembers(data.members);
      setSummary(data.summary);
    } catch (err) {
      setError(errorMessage(err, "Import failed - please try again"));
    } finally {
      setBusy(false);
    }
  };

  // --- 3. Send every not-sent invite, a few per request ---

  const sendAll = async () => {
    // Only members with an active Direct Debit mandate
    const ids = invitable.map((m) => m.id);
    if (
      ids.length === 0 ||
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Email the set-up link to ${ids.length} member${
          ids.length === 1 ? "" : "s"
        }?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setFailures([]);
    setProgress({ done: 0, total: ids.length });
    try {
      for (
        let start = 0;
        start < ids.length;
        start += MAX_INVITES_PER_REQUEST
      ) {
        // One batch at a time, in order (keeps under the email rate limit)
        // eslint-disable-next-line no-await-in-loop
        const { data } = await axios.post(
          "/api/admin/dd-members/send-invites",
          { ids: ids.slice(start, start + MAX_INVITES_PER_REQUEST) }
        );
        setMembers(data.members);
        setFailures((all) => [
          ...all,
          ...data.failed.map(
            (f: { name: string; message: string }) => `${f.name}: ${f.message}`
          ),
        ]);
        setProgress({
          done: Math.min(start + MAX_INVITES_PER_REQUEST, ids.length),
          total: ids.length,
        });
      }
    } catch (err) {
      // Stopped part way - the ones sent so far are marked, so "Send all"
      // again carries on with the rest
      setError(
        errorMessage(err, "Sending stopped - press Send again to carry on")
      );
    } finally {
      setBusy(false);
    }
  };

  // --- What to show ---

  const query = search.trim().toLowerCase();
  const shown = members.filter(
    (m) =>
      (tab === "all" || m.invite_status === tab) &&
      (!query ||
        `${m.first_name} ${m.last_name} ${m.email}`
          .toLowerCase()
          .includes(query))
  );

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {/* --- Import + send all --- */}
      <section className="flex flex-col gap-3 rounded-xl border-2 border-lightGold bg-lightBlack/90 p-5 text-gray-300">
        <p className="text-sm">
          Members with an active Direct Debit in GoCardless. Import them, check
          the details (and add the second singer on joint memberships), then
          send the invites - each gets an email with a link to choose their home
          choir and a password. No payment is taken.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={BIG_BUTTON}
            onClick={importMembers}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faCloudDownloadAlt} /> Import from GoCardless
          </button>
          <button
            type="button"
            className={BIG_BUTTON}
            onClick={sendAll}
            disabled={busy || invitable.length === 0}
          >
            <FontAwesomeIcon icon={faPaperPlane} /> Send all not-sent invites (
            {invitable.length})
          </button>
        </div>

        {summary && (
          <div className="rounded-lg bg-white/5 p-3 text-sm" role="status">
            <p>
              Imported {summary.created} new member
              {summary.created === 1 ? "" : "s"}
              {summary.alreadyImported > 0 &&
                ` · ${summary.alreadyImported} already here`}
              {summary.updatedExisting > 0 &&
                ` · ${summary.updatedExisting} already had an account (Direct Debit linked)`}
            </p>
            {summary.skippedNoEmail.length > 0 && (
              <p className="text-red-300">
                No email in GoCardless, so not imported:{" "}
                {summary.skippedNoEmail.join(", ")}
              </p>
            )}
            {summary.sharedEmail.length > 0 && (
              <p className="text-lightGold">
                More than one Direct Debit with the same email (counted together
                - add the other singers from their card):{" "}
                {summary.sharedEmail.join(", ")}
              </p>
            )}
            {summary.joint.length > 0 && (
              <p className="text-lightGold">
                Joint memberships - add the second singer from their card:{" "}
                {summary.joint.join(", ")}
              </p>
            )}
            {summary.otherAmount.length > 0 && (
              <p className="text-lightGold">
                Not the single or joint price - please check:{" "}
                {summary.otherAmount.join(", ")}
              </p>
            )}
            {summary.mandateNotActive.length > 0 && (
              <p className="text-red-300">
                Direct Debit not active, so not imported (they&apos;ll be picked
                up by a later import once it&apos;s active):{" "}
                {summary.mandateNotActive.join(", ")}
              </p>
            )}
          </div>
        )}

        {progress && (
          <div role="status">
            <p className="text-sm">
              Sent {progress.done} of {progress.total}
            </p>
            <div className="h-2 w-full overflow-hidden rounded bg-white/20">
              <div
                className="h-full bg-lightGold transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {failures.length > 0 && (
          <div className="text-sm text-red-300">
            <p>Couldn&apos;t email:</p>
            <ul className="list-disc pl-5">
              {failures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
      </section>

      {/* --- Tabs + search --- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-1.5 font-bold ${
                tab === value
                  ? "bg-lightGold text-black"
                  : "border border-lightGold/60 text-lightGold"
              }`}
            >
              {label} ({count(value)})
            </button>
          ))}
        </div>
        <input
          className="min-w-0 flex-1 rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search by name or email"
        />
      </div>

      {/* --- The members --- */}
      {shown.length === 0 ? (
        <p className="text-gray-400">
          {members.length === 0
            ? "Nobody yet - import from GoCardless to start."
            : "Nobody here."}
        </p>
      ) : (
        shown.map((member) => (
          <DDMemberCard
            key={member.id}
            member={member}
            onMembers={setMembers}
          />
        ))
      )}
    </div>
  );
}
