import axios from "axios";
import React, { useEffect, useState } from "react";

import { DD_GRACE_DAYS } from "@/src/lib/directDebit";
import type { ActiveMembersReport as Report } from "@/src/lib/reportsShared";

import {
  CARD,
  errorMessage,
  ReportError,
  StatTile,
  TABLE,
  TD,
  TH,
} from "./reportUi";

// "Active members" report - how many members are active right now, by type
// and by home choir. Loads when it opens.
export function ActiveMembersReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    axios
      .get<Report>("/api/admin/reports/active-members")
      .then(({ data }) => {
        if (!cancelled) setReport(data);
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
  if (!report)
    return <p className="text-center text-sm italic text-white">Loading...</p>;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className={CARD}>
        <div className="flex flex-wrap gap-3">
          <StatTile label="Active members" value={report.total} />
          <StatTile label="Direct Debit" value={report.by_type.dd} />
          <StatTile label="Flexi" value={report.by_type.flexi} />
          <StatTile label="GAs" value={report.by_type.ga} />
        </div>
        <div className="flex flex-wrap gap-3">
          <StatTile
            muted
            label={`DD in the ${DD_GRACE_DAYS}-day grace period (included above)`}
            value={report.dd_grace}
          />
          <StatTile
            muted
            label="DD ended (not active)"
            value={report.dd_ended}
          />
          <StatTile
            muted
            label="Flexi expired (not active)"
            value={report.flexi_expired}
          />
        </div>
      </div>

      <div className={CARD}>
        <h2 className="m-0 p-0 text-xl">By home choir</h2>
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Choir</th>
                <th className={TH}>DD</th>
                <th className={TH}>Flexi</th>
                <th className={TH}>GAs</th>
                <th className={TH}>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.by_choir.map((row) => (
                <tr key={row.choir}>
                  <td className={TD}>{row.choir}</td>
                  <td className={TD}>{row.dd}</td>
                  <td className={TD}>{row.flexi}</td>
                  <td className={TD}>{row.ga}</td>
                  <td className={`${TD} font-bold`}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
