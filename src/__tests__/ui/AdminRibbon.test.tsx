import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";

import { AdminRibbon } from "@/src/components/admin/AdminRibbon";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
const onPage = (pathname: string, query: Record<string, string> = {}) =>
  (useRouter as jest.Mock).mockReturnValue({ pathname, query });

describe("Admin ribbon", () => {
  it("Should show every tab, with the Reports buttons on the reports page", () => {
    onPage("/members/reports", { report: "attendance" });
    render(<AdminRibbon />);

    ["Reports", "Members", "Music", "Holidays"].forEach((tab) =>
      expect(screen.getByRole("link", { name: tab })).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Attendance" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("link", { name: "Active members" })
    ).not.toHaveAttribute("aria-current");
    // Another tab's buttons aren't shown
    expect(screen.queryByRole("link", { name: "DD members" })).toBeNull();
  });

  it("Should pick Active members when no report is chosen", () => {
    onPage("/members/reports");
    render(<AdminRibbon />);
    expect(
      screen.getByRole("link", { name: "Active members" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("Should open the Members tab on the DD members page", () => {
    onPage("/members/dd-members");
    render(<AdminRibbon />);
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "DD members" })).toHaveAttribute(
      "href",
      "/members/dd-members"
    );
    expect(screen.getByRole("link", { name: "Flexi members" })).toHaveAttribute(
      "href",
      "/members/flexi-members"
    );
  });
});
