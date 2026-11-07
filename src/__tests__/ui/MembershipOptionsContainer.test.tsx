import { render, screen } from "@testing-library/react";

import { MembershipOptionsContainer } from "../../components/MembershipOptionsContainer";

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
  it("should render two options boxes with links and correct text", () => {
    render(
      <MembershipOptionsContainer
        flexiInfo={flexiInfo}
        monthlyInfo={monthlyInfo}
      />
    );
    expect(screen.getByRole("heading", { name: /Flexi/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText(/join flexi/i)).toBeInTheDocument();
    expect(screen.getByText(/join monthly/i)).toBeInTheDocument();
    expect(screen.getByText("Monthly membership")).toBeInTheDocument();
    expect(screen.getByText("Flexi membership")).toBeInTheDocument();
  });

  it("should keep Contentful's text, with or without a price in the heading", () => {
    render(
      <MembershipOptionsContainer
        flexiInfo={flexiInfo}
        monthlyInfo={monthlyInfo}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Form £85" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Form 30" })
    ).toBeInTheDocument();
    expect(screen.getByText(/total control/i)).toBeInTheDocument();
  });
});
