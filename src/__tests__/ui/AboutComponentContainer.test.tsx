import { render, screen } from "@testing-library/react";

import { AboutComponentContainer } from "@/src/components/AboutComponentContainer";

describe("AboutComponentContainer", () => {
  // Define sample props
  const props = {
    title: "Sample Title",
    bodyTxt: "Sample Body Text",
    whatToExpectTxt: "Sample What To Expect Text",
    feelGoodFactorTxt: "Sample Feel Good Factor Text",
  };
  it("Should render all text and images correctly ", () => {
    render(<AboutComponentContainer {...props} />);

    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.bodyTxt)).toBeInTheDocument();
    expect(screen.getByText(props.whatToExpectTxt)).toBeInTheDocument();
    expect(screen.getByText(props.feelGoodFactorTxt)).toBeInTheDocument();

    expect(
      screen.getByAltText("show choir on theatre steps")
    ).toBeInTheDocument();
    expect(screen.getByAltText("show choir on stage")).toBeInTheDocument(); // Assuming two images are present
  });
});
