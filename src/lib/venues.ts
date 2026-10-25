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

// Choir names in the order set in Contentful, e.g. ["Banstead", "Leatherhead", ...]
export const choirNames = (venues: ChoirVenue[]) =>
  [...venues]
    .sort((a, b) => a.order - b.order)
    .map((venue) => choirName(venue.location));
