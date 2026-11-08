import {
  faqJsonLd,
  organizationJsonLd,
  rehearsalTimes,
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

describe("rehearsalTimes", () => {
  it.each([
    ["8pm - 9:30pm", { start: "20:00", end: "21:30" }],
    ["10:30 am - 12pm", { start: "10:30", end: "12:00" }],
    ["8 - 9.30pm", { start: "20:00", end: "21:30" }],
  ])("reads %s", (time, expected) => {
    expect(rehearsalTimes(time)).toEqual(expected);
  });

  it.each([[""], ["evenings"], ["8pm"], ["9pm - 8pm"], ["8 - 9:30"]])(
    "gives null for %s rather than guess",
    (time) => {
      expect(rehearsalTimes(time)).toBeNull();
    }
  );
});

describe("venueJsonLd", () => {
  const base = {
    location: "Show Choir Dorking",
    slug: "choir-dorking-surrey",
    address: doc("Crossways Baptist Church", "Junction Road", "RH4 3HB"),
    choirDayOfWeek: "Tuesday",
    time: "8pm - 9:30pm",
    summary: "Join our choir in Dorking.",
    monthlyPricePence: 3000,
  };

  it("includes the place, the weekly rehearsal and the prices", () => {
    const data = venueJsonLd(base);
    expect(data.location.address).toMatchObject({
      streetAddress: "Junction Road",
      addressLocality: "Dorking",
      postalCode: "RH4 3HB",
    });
    expect(data.event?.eventSchedule).toMatchObject({
      byDay: "https://schema.org/Tuesday",
      startTime: "20:00",
      endTime: "21:30",
      repeatFrequency: "P1W",
    });
    expect(data.event?.eventSchedule).not.toHaveProperty("startDate");
    expect(data.event?.offers.map((offer) => offer.price)).toEqual([
      "0",
      "30.00",
    ]);
  });

  it("gives a new choir's start date", () => {
    const data = venueJsonLd({
      ...base,
      location: "Show Choir Walton on Thames",
    });
    expect(data.event?.eventSchedule.startDate).toBe("2027-01-19");
  });

  it("leaves out the rehearsal when the time can't be read", () => {
    expect(venueJsonLd({ ...base, time: "TBC" })).not.toHaveProperty("event");
  });
});

describe("organizationJsonLd", () => {
  it("lists each choir's town and page", () => {
    const data = organizationJsonLd([
      { location: "Show Choir Cobham", slug: "choir-cobham-surrey" },
    ]);
    expect(data.areaServed).toEqual([{ "@type": "Place", name: "Cobham" }]);
    expect(data.subOrganization).toEqual([
      { "@id": "https://show-choir.co.uk/venues/choir-cobham-surrey#choir" },
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
