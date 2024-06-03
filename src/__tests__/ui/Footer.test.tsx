import { render, screen } from "@testing-library/react";
import { format } from "date-fns";

import Footer from "@/src/components/Footer";

const currentYear = format(new Date(), "yyyy").toString();

const mockPathData = [
  { slug: "show-choir-membership-options", displayText: "Join", order: 4 },
  { slug: "about-show-choir-surrey", displayText: "About", order: 2 },
  { slug: "show-choir-locations", displayText: "Choirs", order: 3 },
  { slug: "auth/signin", displayText: "Login", order: 22 },
];

describe("Footer", () => {
  it("should render a logo component", () => {
    render(<Footer pathData={mockPathData} />);
    expect(screen.getByAltText(/show choir logo/i)).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    // create new dat and check it is in the present and in the document.
    expect(screen.getByText(`© ${currentYear} Show Choir`)).toBeInTheDocument();
  });
});
