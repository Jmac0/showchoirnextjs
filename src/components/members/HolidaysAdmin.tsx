import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import { HolidayBanner } from "@/src/components/HolidayBanner";
import {
  formatHolidayDate,
  holidayMessage,
  HolidayRow,
  MAX_HOLIDAY_NOTE,
} from "@/src/lib/holidaysShared";
import { ukDate } from "@/src/lib/ukDate";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";
const INPUT = "w-full rounded py-2 pl-2 text-base text-black";

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// The "Holidays" admin page's contents - the breaks with no rehearsals. While
// one is on, the Book a taster form shows "We are on holiday until ...", so
// people don't book a taster for a week with no choir.
export function HolidaysAdmin({
  initialHolidays,
}: {
  initialHolidays: HolidayRow[];
}) {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [start, setStart] = useState("");
  const [backOn, setBackOn] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const today = ukDate();

  const addHoliday = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post("/api/admin/holidays", {
        start,
        back_on: backOn,
        note,
      });
      setHolidays(data.holidays);
      setStart("");
      setBackOn("");
      setNote("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't save - please try again"));
    } finally {
      setBusy(false);
    }
  };

  const deleteHoliday = async (holiday: HolidayRow) => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Delete the holiday from ${formatHolidayDate(holiday.start)}?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.delete(`/api/admin/holidays/${holiday.id}`);
      setHolidays(data.holidays);
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete - please try again"));
    } finally {
      setBusy(false);
    }
  };

  // On now, coming up or over - same rule as the banner (lib/holidays.ts)
  const status = (holiday: HolidayRow) => {
    if (holiday.back_on <= today) return "Over";
    if (holiday.start <= today) return "On now";
    return "Coming up";
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form
        onSubmit={addHoliday}
        className="flex flex-col gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-5"
      >
        <h2 className="m-0 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text p-0 text-transparent">
          Add a holiday
        </h2>
        <p className="m-0 text-sm">
          The Book a taster form says &ldquo;We are on holiday until&nbsp;
          ...&rdquo; from the first day off until the day before you&apos;re
          back.
        </p>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 flex-col gap-1" htmlFor="holidayStart">
            First day off
            <input
              id="holidayStart"
              type="date"
              required
              className={INPUT}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1" htmlFor="holidayBackOn">
            Back on
            <input
              id="holidayBackOn"
              type="date"
              required
              min={start || undefined}
              className={INPUT}
              value={backOn}
              onChange={(e) => setBackOn(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1" htmlFor="holidayNote">
          Note (optional, only admins see it)
          <input
            id="holidayNote"
            type="text"
            maxLength={MAX_HOLIDAY_NOTE}
            placeholder="e.g. Christmas"
            className={INPUT}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {backOn && <HolidayBanner message={holidayMessage(backOn)} />}
        <button
          type="submit"
          disabled={busy || !start || !backOn}
          className={`${BIG_BUTTON} self-center`}
        >
          <FontAwesomeIcon icon={faPlus} /> Add holiday
        </button>
        {error && (
          <p role="alert" className="m-0 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-3">
        {holidays.length === 0 && (
          <p className="text-center text-sm italic">No holidays yet</p>
        )}
        {holidays.map((holiday) => (
          <div
            key={holiday.id}
            className={`flex items-center gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-4 ${
              status(holiday) === "Over" ? "opacity-50" : ""
            }`}
          >
            <div className="flex flex-1 flex-col">
              <span className="font-bold">
                {formatHolidayDate(holiday.start)} &ndash; back{" "}
                {formatHolidayDate(holiday.back_on)}
              </span>
              <span className="text-sm text-gray-300">
                {status(holiday)}
                {holiday.note && ` · ${holiday.note}`}
              </span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => deleteHoliday(holiday)}
              className="rounded-md p-2 text-red-400 hover:bg-red-400/20 disabled:opacity-50"
              aria-label={`Delete the holiday from ${formatHolidayDate(
                holiday.start
              )}`}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
