import { render, screen } from "@testing-library/react";

import Home from "@/src/pages/index";

describe("index.tsx", () => {
  it("should render the correct heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /welcome to show choir/i })
    ).toBeInTheDocument();
  });
});
