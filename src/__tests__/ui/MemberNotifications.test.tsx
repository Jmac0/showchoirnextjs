import { render, screen } from "@testing-library/react";

import { MemberNotifications } from "@/src/components/members/MemberNotifications";

const mockNotifications = {
  items: [
    {
      fields: {
        title: "mock title",
        details: "mock info",
        date: "02/02/2020",
        pinned: true,
      },
    },
    {
      fields: {
        title: "mock title 2",
        details: "mock info",
        date: "01/01/2020",
        pinned: false,
      },
    },
  ],
};
describe("render", () => {
  it("Should render a list of notifications, ordered by pinned status and then date", () => {
    render(<MemberNotifications notifications={mockNotifications} />);

    const notifications = screen.getAllByTestId("notification");
    const titles = notifications.map((element) => {
      const titleElement = element.querySelector("h2");
      return titleElement?.textContent;
    });
    expect(titles.length).toEqual(2);
    // the pinned notification should be first in the array as it is pinned, even if the date is after the other notification
    expect(titles[0]).toBe("mock title");
  });
});
