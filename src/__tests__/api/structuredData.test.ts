import {
  faqJsonLd,
  organizationJsonLd,
  richTextLines,
  splitAddress,
  venueJsonLd,
} from "../../lib/structuredData";

// Contentful rich text with one paragraph per string
const doc = (...paragraphs: string[]) => ({
  nodeType: "document",
  content: paragraphs.map((value) => ({
    nodeType: "paragraph",
    content: [{ nodeType: "text", value }],
  })),
});

describe("richTextLines", () => {
  it("splits paragraphs and line breaks, trimming spaces and end commas", () => {
    expect(
      richTextLines(
        doc("West Byfleet Infants School", "Camphill Road\nWest Byfleet\n")
      )
    ).toEqual(["West Byfleet Infants School", "Camphill Road", "West Byfleet"]);
    expect(richTextLines(doc(" Picquets Way,", " "))).toEqual(["Picquets Way"]);
  });

  it("copes with no address", () => {
    expect(richTextLines(undefined)).toEqual([]);
  });
});

// address lines as they are in Contentful
describe("splitAddress", () => {
  it("separates building, street and postcode, leaving out the town", () => {
    expect(
      splitAddress(
        ["Crossways Baptist Church", "Junction Road", "Dorking", "RH4 3HB"],
        "Dorking"
      )
    ).toEqual({
      placeName: "Crossways Baptist Church",
      streetAddress: "Junction Road",
      postalCode: "RH4 3HB",
    });
  });

  it("drops a launch note and the county, and matches the town loosely", () => {
    expect(
      splitAddress(
        [
          "Launching January 19th",
          "St Andrews URC Walton and Weybridge",
          "7-19 Hersham Road",
          "Walton-On-Thames",
          "Surrey",
          "KT12 1LQ",
        ],
        "Walton on Thames"
      )
    ).toEqual({
      placeName: "St Andrews URC Walton and Weybridge",
      streetAddress: "7-19 Hersham Road",
      postalCode: "KT12 1LQ",
    });
  });

  it("finds a postcode sharing a line with the town", () => {
    expect(
      splitAddress(["The Beacon School", "Banstead sm71ag"], "Banstead")
    ).toEqual({
      placeName: "The Beacon School",
      streetAddress: undefined,
      postalCode: "SM7 1AG",
    });
  });
});

describe("venueJsonLd", () => {
  const base = {
    location: "Show Choir Dorking",
    slug: "choir-dorking-surrey",
    address: doc("Crossways Baptist Church", "Junction Road", "RH4 3HB"),
    summary: "Rehearsals every Tuesday at 8pm - 9:30pm.",
    monthlyPricePence: 3000,
  };

  it("includes the place, the description and the prices", () => {
    const data = venueJsonLd(base);
    expect(data.location.address).toMatchObject({
      streetAddress: "Junction Road",
      addressLocality: "Dorking",
      postalCode: "RH4 3HB",
    });
    expect(data.description).toBe(base.summary);
    expect(data.makesOffer.map((offer) => offer.price)).toEqual(["0", "30.00"]);
  });

  // Google requires a start date on every Event, so a weekly rehearsal
  // marked up as one is reported as an error
  it("doesn't mark the rehearsal up as an Event", () => {
    expect(venueJsonLd(base)).not.toHaveProperty("event");
  });

  it("copes with no address", () => {
    expect(venueJsonLd({ ...base, address: undefined }).location.name).toBe(
      "Dorking"
    );
  });
});

describe("organizationJsonLd", () => {
  it("lists each choir's town and page", () => {
    const data = organizationJsonLd([
      { location: "Show Choir Cobham", slug: "choir-cobham-surrey" },
    ]);
    expect(data.areaServed).toEqual([{ "@type": "Place", name: "Cobham" }]);
    expect(data.subOrganization).toEqual([
      {
        "@id": "https://www.show-choir.co.uk/venues/choir-cobham-surrey#choir",
      },
    ]);
  });
});

describe("faqJsonLd", () => {
  it("turns questions into FAQPage entries", () => {
    expect(faqJsonLd([{ question: "Q?", answer: "A." }]).mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Q?",
        acceptedAnswer: { "@type": "Answer", text: "A." },
      },
    ]);
  });
});
