import { render, screen } from "@testing-library/react";

import { Hero } from "@/src/components/Hero";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
describe("Hero component", () => {
  it(
    "should display the show choir logo, hero image and the passed in" +
      " text",
    () => {
      const mockHeroText = "Welcome To Show Choir";
      const mockBgImage = {
        src: "/public/mock-background.jpg",
        width: 1920,
        height: 800,
      };

      render(<Hero bgImage={mockBgImage} heroText={mockHeroText} />);

      expect(screen.getByAltText(/show choir logo/i)).toBeInTheDocument();
      expect(
        screen.getByAltText(/image of choir signing/i)
      ).toBeInTheDocument();
      expect(screen.getByText(mockHeroText)).toBeInTheDocument();
    }
  );
});
