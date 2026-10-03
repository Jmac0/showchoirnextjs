import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";

import MemberNav from "@/src/components/Navigation/MemberNav";

// The menu reads the login session (to show "Music admin" to admins)
jest.mock("next-auth/react", () => ({
  ...jest.requireActual("next-auth/react"),
  useSession: jest.fn(),
}));
const mockSession = (role: string) =>
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { email: "test@test.com", role } },
    status: "authenticated",
  });

describe("Member Navigation component", () => {
  it("should render the component and all buttons", async () => {
    mockSession("");
    render(<MemberNav />);
    const buttons = screen.getAllByRole("button");
    const links = screen.getAllByRole("link");
    expect(buttons.length).toBe(3);
    expect(links.length).toBe(6);

    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    // Members don't see the admin link
    expect(screen.queryByRole("link", { name: /music admin/i })).toBeNull();
  });

  it("should hide Notifications and Resources when the membership isn't active", () => {
    mockSession("");
    render(<MemberNav membershipActive={false} />);
    expect(screen.queryByRole("link", { name: /notifications/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /resources/i })).toBeNull();
    expect(screen.getByRole("link", { name: /account/i })).toBeInTheDocument();
  });

  it("should show the Music admin link to admins only", () => {
    mockSession("admin");
    render(<MemberNav />);
    expect(screen.getByRole("link", { name: /music admin/i })).toHaveAttribute(
      "href",
      "/members/music-admin"
    );
  });
});
