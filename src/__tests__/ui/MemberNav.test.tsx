import { render, screen } from "@testing-library/react";

import MemberNav from "@/src/components/Navigation/MemberNav";

describe("Member Navigation component", () => {
  it("should render the component and all buttons", async () => {
    const mockSetComponent = jest.fn();
    render(<MemberNav setComponent={mockSetComponent} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(7);
    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
  });
});
