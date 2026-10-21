import axios from "axios";
import React, { useState } from "react";

import {
  FlexiSessionsReport as Report,
  formatPence,
  ReportVenue,
} from "@/src/lib/reportsShared";
import { ukDate } from "@/src/lib/ukDate";

import {
  BIG_BUTTON,
  CARD,
  errorMessage,
  INPUT,
  ReportError,
  StatTile,
  TABLE,
  TD,
  TH,
} from "./reportUi";

const PACK_ROWS = [
  { key: "online", label: "Online" },
  { key: "cash", label: "Cash at the desk" },
  { key: "card", label: "Card at the desk" },
] as const;

// "Flexi sessions" report - flexi sessions used at check-in between two
// dates, by choir, and the flexi packs bought in the same dates
export function FlexiSessionsReport({ venues }: { venues: ReportVenue[] }) {
  const today = ukDate();
  // From the 1st of this month to today
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const venueName = (slug: string) =>
    venues.find((venue) => venue.slug === slug)?.name ?? slug;

  const showReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.get<Report>(
        "/api/admin/reports/flexi-sessions",
        { params: { from, to } }
      );
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(errorMessage(err, "Couldn't load - please try again"));
    } finally {
      setBusy(false);
    }
  };

  const packsTotal = report
    ? PACK_ROWS.reduce(
        (sum, row) => ({
          count: sum.count + report.packs[row.key].count,
          amount_pence: sum.amount_pence + report.packs[row.key].amount_pence,
        }),
        { count: 0, amount_pence: 0 }
      )
    : null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <form onSubmit={showReport} className={CARD}>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 flex-col gap-1" htmlFor="reportFrom">
            From
            <input
              id="reportFrom"
              type="date"
              required
              className={INPUT}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1" htmlFor="reportTo">
            To
            <input
              id="reportTo"
              type="date"
              required
              min={from || undefined}
              className={INPUT}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || !from || !to}
          className={`${BIG_BUTTON} self-center`}
        >
          Show flexi sessions
        </button>
        <ReportError error={error} />
      </form>

      {report && packsTotal && (
        <>
          <div className={CARD}>
            <div className="flex flex-wrap gap-3">
              <StatTile
                label="Flexi sessions used"
                value={report.sessions_used}
              />
              <StatTile label="Packs bought" value={packsTotal.count} />
              <StatTile
                label="Taken for packs"
                value={formatPence(packsTotal.amount_pence)}
              />
            </div>
          </div>

          <div className={CARD}>
            <h2 className="m-0 p-0 text-xl">Sessions used by choir</h2>
            {report.by_venue.length === 0 ? (
              <p className="m-0 text-sm italic text-white">
                No flexi sessions used in these dates
              </p>
            ) : (
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Choir</th>
                    <th className={TH}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_venue.map((row) => (
                    <tr key={row.venue}>
                      <td className={TD}>{venueName(row.venue)}</td>
                      <td className={TD}>{row.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={CARD}>
            <h2 className="m-0 p-0 text-xl">Packs bought</h2>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>How</th>
                  <th className={TH}>Packs</th>
                  <th className={TH}>Taken</th>
                </tr>
              </thead>
              <tbody>
                {PACK_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className={TD}>{row.label}</td>
                    <td className={TD}>{report.packs[row.key].count}</td>
                    <td className={TD}>
                      {formatPence(report.packs[row.key].amount_pence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
