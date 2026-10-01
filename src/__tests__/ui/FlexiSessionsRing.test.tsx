import { render, screen } from "@testing-library/react";

import { FlexiSessionsRing } from "@/src/components/members/FlexiSessionsRing";

describe("Flexi Sessions Ring Component", () => {
  it("Should show the sessions left", () => {
    render(<FlexiSessionsRing remaining={7} />);
    expect(
      screen.getByRole("img", { name: /7 flexi sessions left/i })
    ).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/sessions left/i)).toBeInTheDocument();
  });

  it("Should show the real count above a full pack (e.g. after a top-up)", () => {
    render(<FlexiSessionsRing remaining={17} />);
    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("Should show sessions owed when the balance is negative", () => {
    render(<FlexiSessionsRing remaining={-2} />);
    expect(
      screen.getByRole("img", { name: /2 flexi sessions owed/i })
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/sessions owed/i)).toBeInTheDocument();
  });

  it("Should say session (not sessions) when 1 is owed", () => {
    render(<FlexiSessionsRing remaining={-1} />);
    expect(screen.getByText(/^session owed$/i)).toBeInTheDocument();
  });
});
