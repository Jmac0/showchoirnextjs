import { render, screen } from "@testing-library/react";

import { ChoirOptions } from "@/src/components/forms/ChoirOptions";
import { choirName } from "@/src/lib/venues";
import { mockVenues } from "@/src/mocks/venues";

describe("Choir options (shared choir list)", () => {
  it("Should list the Contentful choirs by town name, in Contentful's order", () => {
    render(
      <select aria-label="choir">
        <ChoirOptions venues={mockVenues} />
      </select>
    );
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    // mockVenues is out of order on purpose - sorted by `order`
    expect(options).toEqual([
      "Choose a choir",
      "Banstead",
      "Leatherhead",
      "West Byfleet",
    ]);
  });

  it("Should turn a Contentful location into the town name", () => {
    expect(choirName("Show Choir West Byfleet")).toBe("West Byfleet");
    expect(choirName("Banstead")).toBe("Banstead");
  });
});
