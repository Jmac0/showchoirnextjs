import { render, screen } from "@testing-library/react";

import MemberBenefits from "@/src/components/MemberBenefits";

const mockListData = [
  {
    type: "ul",
    props: {
      children: [
        {
          type: "li",
          props: {
            children: "Mock list item 1",
          },
        },
        {
          type: "li",
          props: {
            children: "Mock list item 2",
          },
        },
      ],
    },
  },
];
describe("Member benefits component", () => {
  it("should render an all elements correctly", () => {
    render(<MemberBenefits benefitsList={mockListData} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /book now/i })
    ).toBeInTheDocument();
  });
});
