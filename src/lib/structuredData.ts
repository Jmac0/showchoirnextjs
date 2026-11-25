import { choirName } from "./venues";

// Structured data (JSON-LD): a machine-readable summary of a page, in the
// shared schema.org vocabulary, that search engines and AI tools read to find
// facts - where and when each choir meets, what it costs, the answers to
// common questions - without guessing from the page's wording. Shown on the
// page with jsonLdScript() (components/JsonLd.tsx).
//
// This file runs in the browser too (pages build it while rendering), so it
// must not import server-only code.

// The live site's address - www is the one Vercel serves (the bare domain
// redirects to it), the one Google has indexed and the one the app uses
export const SITE_URL = "https://www.show-choir.co.uk";
// One id for Show Choir as a whole, so the choir pages can point back to it
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const PHONE = "+447957928099";

// Show Choir's own Facebook and Instagram pages (the whole choir's, so they
// go on the Show Choir entry below, not on each town's choir)
export const SOCIAL_PROFILES = [
  "https://www.facebook.com/profile.php?id=61588907476935",
  "https://www.instagram.com/show_choir_uk",
];

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

type VenueDetails = {
  location: string;
  slug: string;
  address?: RichTextNode | null;
  // the page's own one-line summary, which says the rehearsal day and time
  summary: string;
  // the monthly Direct Debit price, in pence
  monthlyPricePence: number;
  // a 10-session Flexi pack, in pence (left out when not offered)
  flexiPricePence?: number;
  // a photo of the choir (a full address)
  image?: string;
  // where the hall is on a map, from the venue's "geo" field in Contentful
  geo?: { lat: number; lon: number };
  // nearby places members come from (the venue's "areasServed")
  areasServed?: string[];
};

// One choir's page: the choir, where it meets (building, street, postcode),
// when (in its description) and what it costs - the facts people ask AI
// tools about, e.g. "no audition choir near Dorking - when and how much?".
// The weekly rehearsal isn't marked up as an Event: Google requires each
// event to have its own start date, so a repeating rehearsal shows up as an
// error in Search Console - the day and time go in the description instead
export function venueJsonLd({
  location,
  slug,
  address,
  summary,
  monthlyPricePence,
  flexiPricePence,
  image,
  geo,
  areasServed,
}: VenueDetails) {
  const town = choirName(location);
  const url = `${SITE_URL}/venues/${slug}`;
  const { placeName, streetAddress, postalCode } = splitAddress(
    richTextLines(address),
    town
  );

  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${url}#choir`,
    name: location,
    url,
    description: summary,
    telephone: PHONE,
    genre: "Musical theatre",
    image,
    parentOrganization: { "@id": ORGANIZATION_ID },
    // the town itself, then any nearby places members come from
    areaServed: [town, ...(areasServed ?? [])].map((name) => ({
      "@type": "Place",
      name,
    })),
    location: {
      "@type": "Place",
      name: placeName ?? town,
      geo: geo && {
        "@type": "GeoCoordinates",
        latitude: geo.lat,
        longitude: geo.lon,
      },
      address: {
        "@type": "PostalAddress",
        streetAddress,
        addressLocality: town,
        addressRegion: "Surrey",
        postalCode,
        addressCountry: "GB",
      },
    },
    // what the choir offers and what it costs
    makesOffer: [
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
      ...(flexiPricePence
        ? [
            {
              "@type": "Offer",
              name: "Flexi membership (10 sessions)",
              price: (flexiPricePence / 100).toFixed(2),
              priceCurrency: "GBP",
              url: `${SITE_URL}/flexi-membership`,
            },
          ]
        : []),
    ],
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
    // who runs it - AI tools trust a named, real person behind a group
    founder: {
      "@type": "Person",
      name: "Angela Mackenzie",
      jobTitle: "Founder and choir leader",
      description:
        "Former professional opera singer and founder of Show Choir.",
      image: `${SITE_URL}/ange-half-length.png`,
    },
    // the same pages the footer links to
    sameAs: SOCIAL_PROFILES,
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
