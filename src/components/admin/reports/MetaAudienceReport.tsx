import axios from "axios";
import React, { useEffect, useState } from "react";

import { CARD, errorMessage, ReportError, StatTile } from "./reportUi";

// "Meta list" - the members who ticked the optional Meta box, as a file to
// upload to Meta by hand. Loads when it opens.
export function MetaAudienceReport() {
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ total: number }>("/api/admin/reports/meta-audience")
      .then(({ data }) => {
        if (!cancelled) setTotal(data.total);
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
  if (total === null)
    return <p className="text-center text-sm italic text-white">Loading...</p>;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className={CARD}>
        <div className="flex flex-wrap gap-3">
          <StatTile label="Members on the list" value={total} />
        </div>
        <p className="text-sm text-gray-300">
          Active members who are over 18 and ticked the box. Meta needs at least
          100 of them to match its accounts before it can build a lookalike.
        </p>
        {/* A plain link, as this downloads a file rather than opening a page */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/reports/meta-audience?download=1"
          className="self-start rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white"
        >
          Download the list
        </a>
        <p className="text-sm text-gray-300">
          Update Meta&apos;s copy at least once a month, as the privacy policy
          promises: download a fresh list and use Meta&apos;s option to{" "}
          <b>replace</b> the customers in the audience. Adding to it would leave
          behind anyone who has changed their mind or deleted their account.
          Delete the file when you&apos;ve finished.
        </p>
      </div>
    </div>
  );
}
