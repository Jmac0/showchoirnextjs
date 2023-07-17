import { render, screen } from "@testing-library/react";

import MembershipOptionsContainer from "../../components/MembershipOptionsContainer";

const flexiInfo = `
 # Flexi
 ## Form £85
Flexi membership allows you total control.
 `;
const monthlyInfo = `
 # Monthly
## Form 30
Our most popular membership`;

describe("Membership Options Component", () => {
  it("should render two options boxes with buttons and correct text", () => {
    render(
      <MembershipOptionsContainer
        flexiInfo={flexiInfo}
        monthlyInfo={monthlyInfo}
      />
    );
    expect(screen.getByRole("heading", { name: /Flexi/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
