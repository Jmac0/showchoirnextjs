import { render, screen } from "@testing-library/react";

import { Nav } from "@/src/components/Navigation/Nav";
// import { PageItemType } from "@/src/types/types";

export type PageItemType = {
  slug: string;
  displayText: string;
  order: number;
}[];

const pathData: PageItemType = [
  { slug: "about-show-choir-surrey", displayText: "About", order: 2 },
  { slug: "show-choir-membership-options", displayText: "Join", order: 3 },
  { slug: "show-choir-member-area", displayText: "Login", order: 4 },
];
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
describe("Navigation component", () => {
  it(
    "should render the navigation component with 2 nav elements, one" +
      " mobile one desktop",
    () => {
      render(<Nav pathData={pathData} />);
      expect(screen.getAllByRole("navigation")).toHaveLength(2);
    }
  );

  it("Should render 2 of each navigation link, one for desktop and one for mobile", () => {
    render(<Nav pathData={pathData} />);
    expect(screen.getAllByRole("link", { name: /home/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /about/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /join/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /login/i })).toHaveLength(2);
  });
});
