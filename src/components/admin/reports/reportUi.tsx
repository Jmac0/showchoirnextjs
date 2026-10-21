import axios from "axios";
import React from "react";

// Shared bits for the admin reports (components/admin/reports)

export const CARD =
  "flex w-full flex-col gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-5 text-white";
export const INPUT = "w-full rounded py-2 pl-2 text-base text-black";
export const BIG_BUTTON =
  "flex items-center justify-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";
export const TABLE = "w-full border-collapse text-left text-sm";
export const TH = "border-b border-lightGold/50 px-2 py-2 font-bold";
export const TD = "border-b border-white/10 px-2 py-2";

// The message from a failed request to our API
export const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// One number with its label, e.g. "Active members 142"
export function StatTile({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  // Greyed out - for numbers that aren't part of the main total
  muted?: boolean;
}) {
  return (
    <div
      className={`flex min-w-[8rem] flex-1 flex-col items-center rounded-md border p-3 text-white ${
        muted ? "border-white/20" : "border-lightGold"
      }`}
    >
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-center text-sm">{label}</span>
    </div>
  );
}

StatTile.defaultProps = {
  muted: false,
};

export function ReportError({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="m-0 text-center text-sm text-red-400">
      {error}
    </p>
  ) : null;
}
