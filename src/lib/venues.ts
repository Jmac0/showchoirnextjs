import { VenueType } from "@/src/types/types";

// The choirs come from the "venue" entries in Contentful - the one place to
// add, rename or remove a choir. They feed the venue pages, the "Choose a
// choir" dropdowns (sign-up and book a taster forms) and the app's GA venue
// picker (via api/member-resources/venues.ts).
//
// This file runs in the browser too (the forms use it), so it must not import
// the Contentful client - that only works on the server, where its keys are.
// Pages load the venues with getChoirVenues() in lib/contentfulClient.ts.

// Just what the choir dropdowns need from each venue
export type ChoirVenue = Pick<VenueType, "location" | "order">;

// "Show Choir Banstead" -> "Banstead" - the name shown in the dropdowns and
// saved as a member's home_choir
export const choirName = (location: string) =>
  location.replace(/^Show Choir\s+/i, "").trim();

// New choirs that haven't opened yet, by choir name: when they start (January,
// so UK time is the same as UTC) and how to say it. Remove once it has passed.
const CHOIR_STARTS: Record<string, { at: Date; text: string }> = {
  "Walton on Thames": {
    at: new Date("2027-01-19T20:00:00Z"),
    text: "Starts Tuesday 19th January",
  },
};

// What to say about when a choir starts, or null if it's already running
export const choirStartText = (location: string, now = new Date()) => {
  const start = CHOIR_STARTS[choirName(location)];
  return start && now < start.at ? start.text : null;
};

// When a new choir starts, or undefined for one already running before this
// list was kept (for the venue page's structured data)
export const choirStartDate = (location: string) =>
  CHOIR_STARTS[choirName(location)]?.at;

// Choir names in the order set in Contentful, e.g. ["Banstead", "Leatherhead", ...]
export const choirNames = (venues: ChoirVenue[]) =>
  [...venues]
    .sort((a, b) => a.order - b.order)
    .map((venue) => choirName(venue.location));
