import { render, screen } from "@testing-library/react";

import MemberNav from "@/src/components/Navigation/MemberNav";

describe("Member Navigation component", () => {
  it("should render the component and all buttons", async () => {
    render(<MemberNav />);
    const buttons = screen.getAllByRole("button");
    const links = screen.getAllByRole("link");
    expect(buttons.length).toBe(3);
    expect(links.length).toBe(6);

    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
  });
});
