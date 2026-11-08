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

      render(
        <Hero
          bgImage={mockBgImage}
          heroTextGreeting={mockGreeting}
          heroListItems={mockListData}
        />
      );

      expect(screen.getByAltText(/^show choir$/i)).toBeInTheDocument();
      expect(screen.getByAltText(/singing from Oklahoma/i)).toBeInTheDocument();
      expect(screen.getByText(/Mock greeting text/i)).toBeInTheDocument();
      // Ange's handwritten signature (an image, not text)
      expect(screen.getByAltText(/^ange$/i)).toBeInTheDocument();
      expect(screen.getByText(/mock item one/i)).toBeInTheDocument();
    }
  );
});
