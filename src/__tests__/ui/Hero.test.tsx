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
      const mockBgImage = {
        src: "/public/mock-background.jpg",
        width: 1920,
        height: 800,
      };

      const mockListData = [
        "mock Item One",
        "mock Item Two",
        "mock Item Three",
      ];

      const mockGreeting = "Mock greeting text";
      const mockSignature = "Mock signature text";

      render(
        <Hero
          bgImage={mockBgImage}
          heroTextGreeting={mockGreeting}
          heroTextSignature={mockSignature}
          heroListItems={mockListData}
        />
      );

      expect(screen.getByAltText(/show choir logo/i)).toBeInTheDocument();
      expect(
        screen.getByAltText(/image of choir signing/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Mock greeting text/i)).toBeInTheDocument();
      expect(screen.getByText(/Mock signature text/i)).toBeInTheDocument();
      expect(screen.getByText(/mock item one/i)).toBeInTheDocument();
    }
  );
});
