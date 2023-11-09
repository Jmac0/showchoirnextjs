import { render, screen } from "@testing-library/react";

import VenueCardContainer from "@/src/components/VenueCardContainer";

describe("Venue Card Container", () => {
  it("should display the correct background image", () => {
    render(<VenueCardContainer />);
  });
});
