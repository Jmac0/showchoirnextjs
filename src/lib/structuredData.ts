import { choirName, choirStartDate } from "./venues";

// Structured data (JSON-LD): a machine-readable summary of a page, in the
// shared schema.org vocabulary, that search engines and AI tools read to find
// facts - where and when each choir meets, what it costs, the answers to
// common questions - without guessing from the page's wording. Shown on the
// page with jsonLdScript() (components/JsonLd.tsx).
//
// This file runs in the browser too (pages build it while rendering), so it
// must not import server-only code.

export const SITE_URL = "https://show-choir.co.uk";
// One id for Show Choir as a whole, so the choir pages can point back to it
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const PHONE = "+447957928099";

type RichTextNode = {
  nodeType?: string;
  value?: string;
  content?: RichTextNode[];
};

// Contentful rich text -> its lines of plain text. Addresses are typed in
// Contentful sometimes as one paragraph per line, sometimes as one paragraph
// with line breaks, and with stray spaces and commas - this evens them out
export function richTextLines(doc?: RichTextNode | null): string[] {
  const text = (node: RichTextNode): string =>
    node.value ?? (node.content ?? []).map(text).join("");
  return (doc?.content ?? [])
    .flatMap((block) => text(block).split("\n"))
    .map((line) => line.trim().replace(/,$/, "").trim())
    .filter(Boolean);
}

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
// "Walton-On-Thames" and "Walton on Thames" count as the same
const sameWords = (a: string, b: string) =>
  a.toLowerCase().replace(/[^a-z0-9]/g, "") ===
  b.toLowerCase().replace(/[^a-z0-9]/g, "");

// Splits a venue's address lines into the building's name, the street and the
// postcode. The town and county are left out (they're added separately), and
// so is a note like "Launching January 19th" that's sometimes typed in
export function splitAddress(lines: string[], town: string) {
  let postalCode: string | undefined;
  const rest: string[] = [];
  lines.forEach((original) => {
    let line = original;
    const match = line.match(POSTCODE);
    if (match) {
      // "sm71ag" -> "SM7 1AG"
      postalCode ??= match[1]
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/(.{3})$/, " $1");
      line = line.replace(match[0], "").trim().replace(/,$/, "").trim();
    }
    if (!line || /^launching\b/i.test(line)) return;
    if (sameWords(line, town) || sameWords(line, "Surrey")) return;
    rest.push(line);
  });
  const [placeName, ...street] = rest;
  return {
    placeName,
    streetAddress: street.length ? street.join(", ") : undefined,
    postalCode,
  };
}

// "8pm - 9:30pm" -> { start: "20:00", end: "21:30" }, "10:30 am - 12pm" ->
// { start: "10:30", end: "12:00" }. The start can leave out am/pm ("8 -
// 9:30pm"). Anything it can't read for certain gives null, so a wrong time
// is never published
export function rehearsalTimes(time?: string | null) {
  const parts = [
    ...(time ?? "").matchAll(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/gi),
  ];
  if (parts.length !== 2) return null;
  const [start, end] = parts;
  const endHalf = end[3]?.toLowerCase();
  const startHalf = start[3]?.toLowerCase() ?? endHalf;
  if (!startHalf || !endHalf) return null;
  const to24 = (hours: string, minutes: string | undefined, half: string) => {
    const h = (Number(hours) % 12) + (half === "pm" ? 12 : 0);
    const m = Number(minutes ?? 0);
    if (Number(hours) > 12 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const startTime = to24(start[1], start[2], startHalf);
  const endTime = to24(end[1], end[2], endHalf);
  // "HH:MM" strings sort in time order
  if (!startTime || !endTime || startTime >= endTime) return null;
  return { start: startTime, end: endTime };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type VenueDetails = {
  location: string;
  slug: string;
  address?: RichTextNode | null;
  choirDayOfWeek?: string | null;
  time?: string | null;
  // the page's own one-line summary
  summary: string;
  // the monthly Direct Debit price, in pence
  monthlyPricePence: number;
};

// One choir's page: the choir, where it meets (building, street, postcode),
// its weekly rehearsal (day and time) and what it costs - the facts people
// ask AI tools about, e.g. "no audition choir near Dorking - when and how
// much?"
export function venueJsonLd({
  location,
  slug,
  address,
  choirDayOfWeek,
  time,
  summary,
  monthlyPricePence,
}: VenueDetails) {
  const town = choirName(location);
  const url = `${SITE_URL}/venues/${slug}`;
  const { placeName, streetAddress, postalCode } = splitAddress(
    richTextLines(address),
    town
  );
  const place = {
    "@type": "Place",
    name: placeName ?? town,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: town,
      addressRegion: "Surrey",
      postalCode,
      addressCountry: "GB",
    },
  };
  const day = DAYS.find((d) => sameWords(d, choirDayOfWeek ?? ""));
  const times = rehearsalTimes(time);
  const startDate = choirStartDate(location);
  const offers = [
    {
      "@type": "Offer",
      name: "Free taster session",
      price: "0",
      priceCurrency: "GBP",
      url: `${url}#book`,
    },
    {
      "@type": "Offer",
      name: "Monthly membership (Direct Debit)",
      price: (monthlyPricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      url: `${SITE_URL}/monthly-membership`,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${url}#choir`,
    name: location,
    url,
    description: summary,
    telephone: PHONE,
    genre: "Musical theatre",
    parentOrganization: { "@id": ORGANIZATION_ID },
    location: place,
    // only when the day and time could be read for certain
    ...(day &&
      times && {
        event: {
          "@type": "Event",
          name: `${location} weekly rehearsal`,
          description: `A friendly, no audition musical theatre choir rehearsal in ${town}. Your first session is a free taster.`,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: place,
          organizer: { "@id": ORGANIZATION_ID },
          eventSchedule: {
            "@type": "Schedule",
            byDay: `https://schema.org/${day}`,
            startTime: times.start,
            endTime: times.end,
            repeatFrequency: "P1W",
            scheduleTimezone: "Europe/London",
            // a new choir that hasn't opened yet
            ...(startDate && {
              startDate: startDate.toISOString().slice(0, 10),
            }),
          },
          offers,
        },
      }),
  };
}

// Show Choir as a whole, on the home page, listing each choir's page
export function organizationJsonLd(
  venues: { location: string; slug: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": ORGANIZATION_ID,
    name: "Show Choir Surrey",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo.png`,
    description:
      "A friendly, no audition musical theatre choir rehearsing across Surrey.",
    genre: "Musical theatre",
    telephone: PHONE,
    sameAs: [
      "https://facebook.com/showchoiruk/",
      "https://instagram.com/showchoiruk/",
    ],
    areaServed: venues.map((venue) => ({
      "@type": "Place",
      name: choirName(venue.location),
    })),
    subOrganization: venues.map((venue) => ({
      "@id": `${SITE_URL}/venues/${venue.slug}#choir`,
    })),
  };
}

// Questions and answers shown on a page, so AI tools can quote the answers
export function faqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
