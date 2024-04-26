import { render, screen } from "@testing-library/react";

import FeatureBar from "@/src/components/FeatureBar";
import { FeatureDataType } from "@/src/types/types";

const mockImageUrl = "https://example.com/mock-image.jpg";

const mockFeatureData: FeatureDataType = [
  {
    text: "mock feature text 1",
    image: mockImageUrl,
    imageDescription: "mock image description 1",
  },
  {
    text: "mock feature text 2",
    image: mockImageUrl,
    imageDescription: "mock image description 2",
  },
  {
    text: "mock feature text 3",
    image: mockImageUrl,
    imageDescription: "mock image description 3",
  },
];

describe("Feature Bar", () => {
  it("should render the feature bar component with three Feature components & correct content", () => {
    render(<FeatureBar featureData={mockFeatureData} />);
    expect(true).toBe(true);
    const images = screen.getAllByAltText(/mock image description/i);
    expect(images.length).toBe(3);
    const text = screen.getAllByText(/^mock feature text/i);
    expect(text).toHaveLength(3);
  });
});
