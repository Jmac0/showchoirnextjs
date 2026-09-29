import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { getVenueData } from "@/src/lib/contentfulClient";
import { applyCors } from "@/src/lib/cors";
import { ukDate, ukMinutesNow, ukWeekday } from "@/src/lib/ukDate";

export type AppVenue = {
  slug: string;
  location: string;
  choirDayOfWeek: string;
  time: string;
  // True if this choir's rehearsal day is today (UK time)
  rehearsesToday: boolean;
};

export type VenuesResponse = {
  // UK date the app should use for today's rehearsal, "YYYY-MM-DD"
  today: string;
  // Best guess at the rehearsal the GA is at, or null if nothing's on today
  suggested: string | null;
  venues: AppVenue[];
};

const TIME = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;

// Start of a Contentful rehearsal time like "8pm - 9:30pm" or
// "10:30 am - 12pm", in minutes since midnight. null if it can't be read.
export function startMinutes(time: string) {
  const [start, end = ""] = time.split("-");
  const startMatch = start.match(TIME);
  if (!startMatch) return null;
  const [, hours, minutes = "0", startPeriod] = startMatch;
  // "7 - 9pm" - the start borrows am/pm from the end time
  const period = (startPeriod || end.match(TIME)?.[3] || "").toLowerCase();
  let hour24 = Number(hours) % 12;
  if (period === "pm") hour24 += 12;
  return hour24 * 60 + Number(minutes);
}

// Venue list for the GA's "which rehearsal am I scanning for?" picker.
// Venues live in Contentful, the same data as the website's venue pages.
export default async function venues(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!(await requireGA(req, res))) return res;

  const weekday = ukWeekday().toLowerCase();
  const { items } = await getVenueData();

  const venueList: AppVenue[] = [...items]
    .sort((a, b) => a.fields.order - b.fields.order)
    .map(({ fields }) => ({
      slug: fields.slug,
      location: fields.location,
      choirDayOfWeek: fields.choirDayOfWeek,
      time: fields.time,
      // "includes" so "Tuesdays" or "Tuesday evenings" still match
      rehearsesToday: (fields.choirDayOfWeek || "")
        .toLowerCase()
        .includes(weekday),
    }));

  // Suggest today's rehearsal whose start time is closest to now, so on a
  // day with a morning and an evening choir the GA gets the right one.
  const now = ukMinutesNow();
  const distanceFromNow = (venue: AppVenue) =>
    Math.abs(now - (startMinutes(venue.time || "") ?? now + 24 * 60));
  const suggested =
    venueList
      .filter((venue) => venue.rehearsesToday)
      .sort((a, b) => distanceFromNow(a) - distanceFromNow(b))[0]?.slug ?? null;

  const response: VenuesResponse = {
    today: ukDate(),
    suggested,
    venues: venueList,
  };

  return res.status(200).json(response);
}
