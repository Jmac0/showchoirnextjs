import axios from "axios";
import React, { useEffect, useState } from "react";

import type { JoinOfferRow } from "@/src/lib/reportsShared";

import {
  CARD,
  errorMessage,
  ReportError,
  StatTile,
  TABLE,
  TD,
  TH,
} from "./reportUi";

// "Join offers" - who signed up with an offer code (e.g. the Walton launch
// night's flyer). Their cheaper first payment and later full price are set up
// in GoCardless when they join, so this is just to see who's on it.
export function JoinOffersReport() {
  const [members, setMembers] = useState<JoinOfferRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ members: JoinOfferRow[] }>("/api/admin/reports/join-offers")
      .then(({ data }) => {
        if (!cancelled) setMembers(data.members);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(errorMessage(err, "Couldn't load - please try again"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ReportError error={error} />;
  if (members === null)
    return <p className="text-center text-sm italic text-white">Loading...</p>;

  const joined = members.filter((m) => m.direct_debit_started);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div className={CARD}>
        <div className="flex flex-wrap gap-3">
          <StatTile label="Joined with a code" value={joined.length} />
          <StatTile
            muted
            label="Didn't finish the Direct Debit"
            value={members.length - joined.length}
          />
        </div>
        {members.length > 0 && (
          <div className="overflow-x-auto">
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Choir</th>
                  <th className={TH}>Used code</th>
                  <th className={TH}>Direct Debit</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={`${m.email}-${m.applied_at}`}>
                    <td className={TD}>{m.name}</td>
                    <td className={TD}>{m.email}</td>
                    <td className={TD}>{m.home_choir}</td>
                    <td className={TD}>
                      {m.applied_at &&
                        new Date(m.applied_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className={TD}>
                      {!m.direct_debit_started && "Not finished"}
                      {m.direct_debit_started &&
                        (m.active_mandate
                          ? `Started ${m.direct_debit_started}`
                          : "Stopped")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
