import {
  faCloudDownloadAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import { FlexiMemberCard } from "@/src/components/members/FlexiMemberCard";
import {
  InviteStatus,
  MAX_INVITES_PER_REQUEST,
} from "@/src/lib/ddMembersShared";
import {
  FLEXI_TAG,
  FlexiImportSummary,
  FlexiMemberRow,
} from "@/src/lib/flexiMembersShared";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";

type Tab = InviteStatus | "unconfirmed" | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Invite sent" },
  { value: "accepted", label: "Account created" },
  { value: "unconfirmed", label: "Sessions to confirm" },
  { value: "all", label: "All" },
];

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// The "Flexi members" admin page's contents - getting existing Flexi members
// (who used to sign in on paper) set up with accounts:
//   1. Tag them "Flexi" in Mailchimp, then Import from Mailchimp
//   2. Check details, then send the invites - each member gets an email with
//      a link to finish setting up their account (pages/register/welcome.tsx)
//   3. Their sessions are entered from the paper records by the welcome desk
//      the first time they're scanned (or here, by an admin)
export function FlexiMembersAdmin({
  initialMembers,
}: {
  initialMembers: FlexiMemberRow[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [tab, setTab] = useState<Tab>("not_sent");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<FlexiImportSummary | null>(null);
  // Sending everyone: how far through, and anyone it couldn't email
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [failures, setFailures] = useState<string[]>([]);

  // Not invited yet
  const invitable = members.filter(
    (m) => m.invite_status === "not_sent" && m.can_invite
  );

  const inTab = (member: FlexiMemberRow, value: Tab) => {
    if (value === "all") return true;
    if (value === "unconfirmed") return !member.sessions_confirmed;
    return member.invite_status === value;
  };
  const count = (value: Tab) => members.filter((m) => inTab(m, value)).length;

  // --- 1. Import ---

  const importMembers = async () => {
    setBusy(true);
    setError("");
    setSummary(null);
    try {
      const { data } = await axios.post("/api/admin/flexi-members/import");
      setMembers(data.members);
      setSummary(data.summary);
    } catch (err) {
      setError(errorMessage(err, "Import failed - please try again"));
    } finally {
      setBusy(false);
    }
  };

  // --- 2. Send all not-sent invites, in batches ---

  const sendAll = async () => {
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
          "/api/admin/flexi-members/send-invites",
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

  const query = search.trim().toLowerCase();
  const shown = members.filter(
    (m) =>
      inTab(m, tab) &&
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
          Existing Flexi members. Tag them <strong>{FLEXI_TAG}</strong> in
          Mailchimp&apos;s Choir audience, import them, check the details, then
          send the invites - each gets an email with a link to choose their home
          choir and a password. Their sessions are added from the paper records
          by the welcome desk the first time they&apos;re scanned (or enter them
          here).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={BIG_BUTTON}
            onClick={importMembers}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faCloudDownloadAlt} /> Import from Mailchimp
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
            {!summary.tagFound ? (
              <p className="text-red-300">
                No &ldquo;{FLEXI_TAG}&rdquo; tag found in Mailchimp&apos;s Choir
                audience - tag the Flexi members there first.
              </p>
            ) : (
              <p>
                Imported {summary.created} new member
                {summary.created === 1 ? "" : "s"}
                {summary.alreadyImported > 0 &&
                  ` · ${summary.alreadyImported} already here`}
              </p>
            )}
            {summary.alreadyMember.length > 0 && (
              <p className="text-lightGold">
                Already members another way (joined on the website or pay by
                Direct Debit), so left as they are:{" "}
                {summary.alreadyMember.join(", ")}
              </p>
            )}
            {summary.badEmail.length > 0 && (
              <p className="text-red-300">
                Email bounced in Mailchimp, so not imported:{" "}
                {summary.badEmail.join(", ")}
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
            ? "Nobody yet - tag Flexi members in Mailchimp and import to start."
            : "Nobody here."}
        </p>
      ) : (
        shown.map((member) => (
          <FlexiMemberCard
            key={member.id}
            member={member}
            onMembers={setMembers}
          />
        ))
      )}
    </div>
  );
}
