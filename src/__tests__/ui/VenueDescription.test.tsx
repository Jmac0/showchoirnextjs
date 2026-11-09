import { render, screen } from "@testing-library/react";

import { VenueDescription } from "../../components/VenueDescription";

describe("VenueDescription", () => {
  it("shows a markdown heading as a heading, not with its ## marks", () => {
    render(
      <VenueDescription
        text={"## What's it like at Banstead?\n\nOur very first choir."}
      />
    );
    expect(
      screen.getByRole("heading", { name: "What's it like at Banstead?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Our very first choir.")).toBeInTheDocument();
    expect(screen.queryByText(/##/)).toBeNull();
  });
});
