import { render, screen } from "@testing-library/react";

import { MemberNotifications } from "@/src/components/members/MemberNotifications";
import { AnnouncementRow } from "@/src/lib/announcementsShared";

const announcement = (fields: Partial<AnnouncementRow>): AnnouncementRow => ({
  id: "1",
  title: "mock title",
  message: "mock info",
  pinned: false,
  created_at: "2026-11-04T19:00:00.000Z",
  updated_at: null,
  author_name: "Admin",
  ...fields,
});

describe("render", () => {
  it("Should show the announcements in the order given (pinned first, from the server)", () => {
    render(
      <MemberNotifications
        announcements={[
          announcement({ id: "1", title: "mock title", pinned: true }),
          announcement({ id: "2", title: "mock title 2" }),
        ]}
      />
    );

    const titles = screen
      .getAllByTestId("notification")
      .map((element) => element.querySelector("h2")?.textContent);
    expect(titles).toEqual(["mock title", "mock title 2"]);
    expect(screen.getByLabelText("Pinned")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Wednesday,? 4 November 2026/).length
    ).toBeGreaterThan(0);
  });

  it("Should say when there are none", () => {
    render(<MemberNotifications announcements={[]} />);
    expect(screen.getByText("No announcements yet")).toBeInTheDocument();
  });
});
