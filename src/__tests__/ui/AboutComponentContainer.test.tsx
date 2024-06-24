import { render, screen } from "@testing-library/react";

import { AboutComponentContainer } from "@/src/components/AboutComponentContainer";

describe("AboutComponentContainer", () => {
  // Define sample props
  const props = {
    title: "Sample Title",
    heroTextOne: "Sample Hero Text",
    whatToExpectTxt: "Sample What To Expect Text",
    feelGoodFactorTxt: "Sample Feel Good Factor Text",
  };

  const mockMainImageData = {
    fields: {
      file: {
        url: "http://www.example.com",
      },
    },
    title: "mock title",
  };

  it("Should render all text and images correctly ", () => {
    render(
      <AboutComponentContainer {...props} mainImage={mockMainImageData} />
    );

    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.whatToExpectTxt)).toBeInTheDocument();
    expect(screen.getByText(props.heroTextOne)).toBeInTheDocument();
    expect(screen.getByText(props.feelGoodFactorTxt)).toBeInTheDocument();

    expect(
      screen.getByAltText("show choir on theatre steps")
    ).toBeInTheDocument();
    expect(screen.getByAltText("show choir on stage")).toBeInTheDocument();
  });
});
