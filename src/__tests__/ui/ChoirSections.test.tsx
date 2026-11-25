import { BLOCKS } from "@contentful/rich-text-types";
import { render, screen } from "@testing-library/react";

import {
  ChoirHighlights,
  highlightMonth,
} from "../../components/ChoirHighlights";
import {
  ChoirTestimonials,
  FirstNight,
  FromAngela,
  JoinOptions,
  OtherChoirs,
} from "../../components/ChoirSections";
import { choirQuestions, formatPounds } from "../../lib/choirQuestions";
import { venueJsonLd } from "../../lib/structuredData";
import { parseTestimonials } from "../../lib/testimonials";

const address = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      content: [{ nodeType: "text", value: "St Martin's Church Hall" }],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      content: [{ nodeType: "text", value: "Junction Road" }],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      content: [{ nodeType: "text", value: "Dorking" }],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      content: [{ nodeType: "text", value: "rh41dw" }],
    },
  ],
};

describe("choir sections", () => {
  it("names the town in the first night and Angela's closing line", () => {
    render(
      <>
        <FirstNight town="Dorking" />
        <FromAngela closing="She'd love to see you in Dorking." />
      </>
    );
    expect(screen.getByText("Walk in the door in Dorking")).toBeInTheDocument();
    expect(screen.getByText(/love to see you in Dorking/)).toBeInTheDocument();
  });

  it("shows the prices it's given, and leaves Flexi out without one", () => {
    const { rerender } = render(
      <JoinOptions monthlyPrice={30} flexiPrice={95} />
    );
    expect(screen.getByText("£30")).toBeInTheDocument();
    expect(screen.getByText("£95")).toBeInTheDocument();
    expect(
      screen.getByText("Works out at £9.50 a session")
    ).toBeInTheDocument();

    rerender(<JoinOptions monthlyPrice={32} />);
    expect(screen.getByText("£32")).toBeInTheDocument();
    expect(screen.queryByText("Flexi")).toBeNull();
  });
});

describe("choirQuestions", () => {
  it("answers when, where, parking and cost from the choir's details", () => {
    const questions = choirQuestions({
      location: "Show Choir Dorking",
      choirDayOfWeek: "Monday",
      time: "7:30 - 9pm",
      address,
      parking: "Free in the church car park",
      monthlyPrice: 30,
      flexiPrice: 95,
    });
    expect(questions.map((q) => q.question)).toEqual([
      "When does Show Choir Dorking rehearse?",
      "Where does Show Choir Dorking meet?",
      "Is there parking in Dorking?",
      "How much does it cost?",
    ]);
    expect(questions[0].answer).toMatch(/^Every Monday, 7:30 - 9pm\./);
    expect(questions[1].answer).toBe(
      "St Martin's Church Hall, Junction Road, Dorking, RH4 1DW."
    );
    // a full stop is added when Contentful's text has none
    expect(questions[2].answer).toBe("Free in the church car park.");
    expect(questions[3].answer).toMatch(/£30 a month/);
    expect(questions[3].answer).toMatch(/£95 for 10 sessions/);
  });

  it("leaves out what the choir doesn't have yet", () => {
    const questions = choirQuestions({
      location: "Show Choir West Byfleet",
      monthlyPrice: 30,
    });
    expect(questions.map((q) => q.question)).toEqual([
      "How much does it cost?",
    ]);
    expect(questions[0].answer).not.toMatch(/Flexi/);
  });

  it("formats pounds with pence only when needed", () => {
    expect(formatPounds(30)).toBe("£30");
    expect(formatPounds(9.5)).toBe("£9.50");
  });
});

describe("ChoirHighlights", () => {
  it("shows month and year from Contentful's date", () => {
    expect(highlightMonth("2026-06-14")).toBe("June 2026");
    expect(highlightMonth("2026-12-01T19:00+00:00")).toBe("December 2026");
    expect(highlightMonth(null)).toBeNull();
  });

  it("shows each highlight, and nothing at all when there are none", () => {
    const { container, rerender } = render(
      <ChoirHighlights
        town="Dorking"
        highlights={[
          {
            id: "1",
            title: "Christmas at Dorking Halls",
            date: "2025-12-06",
            text: "We sang carols to a full house.",
            photos: [
              {
                url: "https://images.ctfassets.net/a.jpg",
                alt: "The choir on stage at Dorking Halls",
                width: 800,
                height: 600,
              },
            ],
          },
        ]}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Christmas at Dorking Halls" })
    ).toBeInTheDocument();
    expect(screen.getByText("December 2025")).toBeInTheDocument();
    expect(
      screen.getByAltText("The choir on stage at Dorking Halls")
    ).toBeInTheDocument();

    rerender(<ChoirHighlights town="Dorking" highlights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("testimonials", () => {
  it("splits each line into the quote and the first name", () => {
    expect(
      parseTestimonials(
        "\u201cI was so nervous, but everyone was lovely!\u201d - Sue\n\nBest night of my week \u2013 Raj\nNo name here"
      )
    ).toEqual([
      { quote: "I was so nervous, but everyone was lovely!", name: "Sue" },
      { quote: "Best night of my week", name: "Raj" },
      { quote: "No name here", name: null },
    ]);
    expect(parseTestimonials(null)).toEqual([]);
  });

  it("shows the quotes, and nothing without any", () => {
    const { container, rerender } = render(
      <ChoirTestimonials
        town="Banstead"
        testimonials={[{ quote: "Pure joy", name: "Sue" }]}
      />
    );
    expect(screen.getByText(/Pure joy/)).toBeInTheDocument();
    expect(screen.getByText("Sue, Show Choir Banstead")).toBeInTheDocument();
    rerender(<ChoirTestimonials town="Banstead" testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("OtherChoirs", () => {
  it("links to every other choir, in Contentful's order", () => {
    render(
      <OtherChoirs
        currentSlug="choir-banstead-surrey"
        venues={[
          { location: "Show Choir Dorking", slug: "choir-dorking", order: 3 },
          {
            location: "Show Choir Banstead",
            slug: "choir-banstead-surrey",
            order: 1,
          },
          { location: "Show Choir Epsom", slug: "choir-epsom", order: 2 },
        ]}
      />
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Show Choir Epsom",
      "Show Choir Dorking",
    ]);
    expect(links[0]).toHaveAttribute("href", "/venues/choir-epsom");
  });
});

describe("venueJsonLd", () => {
  it("adds the photo, map position, nearby places and Flexi when given", () => {
    const data = venueJsonLd({
      location: "Show Choir Banstead",
      slug: "choir-banstead-surrey",
      address,
      summary: "Every Monday",
      monthlyPricePence: 3000,
      flexiPricePence: 9500,
      image: "https://images.ctfassets.net/choir.jpg",
      geo: { lat: 51.32, lon: -0.2 },
      areasServed: ["Nork", "Tadworth"],
    });
    expect(data.image).toBe("https://images.ctfassets.net/choir.jpg");
    expect(data.location.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 51.32,
      longitude: -0.2,
    });
    expect(data.areaServed.map((place) => place.name)).toEqual([
      "Banstead",
      "Nork",
      "Tadworth",
    ]);
    expect(data.makesOffer.map((offer) => offer.price)).toEqual([
      "0",
      "30.00",
      "95.00",
    ]);
  });
});
