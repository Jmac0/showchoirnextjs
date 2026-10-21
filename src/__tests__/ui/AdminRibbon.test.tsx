import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { AdminRibbon } from "@/src/components/admin/AdminRibbon";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));
const loggedInAs = (role: string) =>
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { email: "test@test.com", role } },
    status: "authenticated",
  });

beforeEach(() => loggedInAs("admin"));
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

  it("Should show just the tabs, none selected, on other members pages", () => {
    onPage("/members/dashboard");
    render(<AdminRibbon />);
    expect(screen.getByRole("link", { name: "Reports" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.queryByRole("link", { name: "Active members" })).toBeNull();
  });

  it("Should show nothing to members who aren't admins", () => {
    loggedInAs("ga");
    onPage("/members/dashboard");
    const { container } = render(<AdminRibbon />);
    expect(container).toBeEmptyDOMElement();
  });
});
