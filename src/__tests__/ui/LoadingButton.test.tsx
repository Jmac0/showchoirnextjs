import { render, screen } from "@testing-library/react";

import { LoadingButton } from "@/src/components/LoadingButton";

describe("Loading Button Component", () => {
  it("should render a button element with text passed a prop", () => {
    render(<LoadingButton loading={false} disabled={false} text="Book Now" />);
    expect(
      screen.getByRole("button", { name: "Book Now" })
    ).toBeInTheDocument();
  });

  it(
    "Should show the text 'Loading' when the loading prop is true and" +
      "it should be disabled",
    () => {
      render(<LoadingButton loading disabled={false} text="Book Now" />);
      const button = screen.getByRole("button", { name: /loading/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("disabled");
    }
  );
  it("Should be disabled when disabled prop is true", () => {
    render(<LoadingButton loading={false} disabled text="Book Now" />);
    const button = screen.getByRole("button", { name: /book now/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("disabled");
  });
});
