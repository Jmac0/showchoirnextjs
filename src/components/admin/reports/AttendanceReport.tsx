import axios from "axios";
import React, { useState } from "react";

import type {
  AttendanceReport as Report,
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

// What a person on the list is: a taster, a GA, or their membership type
const kindOf = (entry: Report["entries"][number]) => {
  if (entry.is_taster) return "Taster";
  if (entry.is_ga) return "GA";
  if (entry.membership_type === "DD") return "DD";
  if (entry.membership_type === "flexi") return "Flexi";
  return entry.membership_type || "";
};

const PAYMENT: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  pay_later: "Pay later",
};

// "Attendance" report - everyone checked in at one choir's rehearsal on a
// chosen date (members, GAs and tasters), with the desk takings
export function AttendanceReport({ venues }: { venues: ReportVenue[] }) {
  const [venue, setVenue] = useState(venues[0]?.slug ?? "");
  const [date, setDate] = useState(ukDate());
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const showReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.get<Report>(
        "/api/admin/reports/attendance",
        { params: { venue, date } }
      );
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(errorMessage(err, "Couldn't load - please try again"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <form onSubmit={showReport} className={CARD}>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 flex-col gap-1" htmlFor="reportVenue">
            Choir
            <select
              id="reportVenue"
              className={INPUT}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            >
              {venues.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1" htmlFor="reportDate">
            Date
            <input
              id="reportDate"
              type="date"
              required
              className={INPUT}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || !venue || !date}
          className={`${BIG_BUTTON} self-center`}
        >
          Show attendance
        </button>
        <ReportError error={error} />
      </form>

      {report && (
        <div className={CARD}>
          <div className="flex flex-wrap gap-3">
            <StatTile label="Here" value={report.summary.total} />
            <StatTile label="DD" value={report.summary.dd} />
            <StatTile label="Flexi" value={report.summary.flexi} />
            <StatTile label="GAs" value={report.summary.ga} />
            <StatTile label="Tasters" value={report.summary.tasters} />
          </div>
          <div className="flex flex-wrap gap-3">
            <StatTile
              muted
              label="Cash taken"
              value={`£${report.summary.cash}`}
            />
            <StatTile
              muted
              label="Card taken"
              value={`£${report.summary.card}`}
            />
            <StatTile
              muted
              label="Pay later"
              value={report.summary.pay_later}
            />
          </div>
          {report.entries.length === 0 ? (
            <p className="m-0 text-center text-sm italic text-white">
              Nobody was checked in at this rehearsal
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Name</th>
                    <th className={TH}>Type</th>
                    <th className={TH}>Paid at the desk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className={TD}>
                        {entry.first_name} {entry.last_name}
                      </td>
                      <td className={TD}>{kindOf(entry)}</td>
                      <td className={TD}>
                        {entry.payment && PAYMENT[entry.payment]}
                        {entry.amount ? ` £${entry.amount}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
