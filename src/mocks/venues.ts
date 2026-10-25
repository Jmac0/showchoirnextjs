import { BLOCKS } from "@contentful/rich-text-types";

import { VenueType } from "@/src/types/types";

// Choir venues for tests, shaped like the Contentful "venue" entries
// (see lib/venues.ts). Deliberately out of order, to check sorting by `order`.
const venue = (town: string, order: number, day: string): VenueType => ({
  location: `Show Choir ${town}`,
  order,
  choirDayOfWeek: day,
  time: "8pm - 9:30pm",
  slug: `choir-${town.toLowerCase().replace(/\s+/g, "-")}-surrey`,
  photo: { fields: { title: town, file: { url: "" } } },
  address: { nodeType: BLOCKS.DOCUMENT, data: {}, content: [] },
});

export const mockVenues: VenueType[] = [
  venue("Leatherhead", 2, "Tuesday"),
  venue("Banstead", 1, "Monday"),
  venue("West Byfleet", 3, "Thursday"),
];
