import { choirStartText } from "@/src/lib/venues";

const WALTON = "Show Choir Walton on Thames";

describe("choirStartText", () => {
  it("shows a new choir's start date until opening night", () => {
    expect(choirStartText(WALTON, new Date("2026-11-06T12:00:00Z"))).toBe(
      "Starts Tuesday 19th January"
    );
    expect(choirStartText(WALTON, new Date("2027-01-19T19:59:00Z"))).toBe(
      "Starts Tuesday 19th January"
    );
  });

  it("stops once it has started", () => {
    expect(choirStartText(WALTON, new Date("2027-01-19T20:00:00Z"))).toBeNull();
  });

  it("shows nothing for a choir that's already running", () => {
    expect(
      choirStartText("Show Choir Dorking", new Date("2026-11-06T12:00:00Z"))
    ).toBeNull();
  });
});
