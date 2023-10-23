import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Dashboard from "@/src/pages/members/dashboard";

export type PageItemType = {
  slug: string;
  displayText: string;
  order: number;
}[];

const pathData: PageItemType = [
  { slug: "about-show-choir-surrey", displayText: "About", order: 2 },
  { slug: "show-choir-membership-options", displayText: "Join", order: 3 },
  { slug: "show-choir-member-area", displayText: "Login", order: 4 },
];

jest.mock("next/router", () => ({
  useRouter() {
    return {
      pathname: "",
    };
  },
}));

jest.mock("next-auth/react", () => {
  const originalModule = jest.requireActual("next-auth/react");
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    // Mock member data returned from [auth].ts
    user: { name: "John", email: "test@test.com", role: "" },
  };

  return {
    __esModule: true,
    ...originalModule,
    useSession: jest.fn(() => ({ data: mockSession, status: "authenticated" })),
  };
});
describe("Dashboard component", () => {
  it("It should render the navigation buttons, and the correct initial page content", () => {
    render(<Dashboard pathData={pathData} />);
    waitFor(() => {
      expect(
        screen.getByRole("button", { name: /lyrics/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /notifications/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /membership card/i })
    ).toBeInTheDocument();
    // expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    // expect(
    //   screen.getByRole("button", { name: /log out/i })
    // ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lyrics/i }));
  });

  it("should display correct component & content when buttons are clicked", async () => {
    render(<Dashboard pathData={pathData} />);

    const user = userEvent.setup();
    const lyricsBtn = await screen.findByRole("button", { name: /lyrics/i });

    const notificationBtn = screen.getByRole("button", {
      name: /notifications/i,
    });
    const accountBtn = screen.getByRole("button", {
      name: /account/i,
    });
    const memberCardBtn = screen.getByRole("button", {
      name: /membership card/i,
    });
    expect(
      screen.getByRole("heading", { name: /lyrics/i })
    ).toBeInTheDocument();

    await user.click(notificationBtn);
    expect(
      await screen.getByRole("heading", {
        name: /member notifications/i,
      })
    ).toBeInTheDocument();
    await user.click(accountBtn);

    expect(
      await screen.findByRole("heading", {
        name: /member account info/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Flexi sessions remaining: 5/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/membership type: flexi/i)).toBeInTheDocument();

    await user.click(memberCardBtn);
    expect(
      screen.getByRole("heading", { name: /membership card/i })
    ).toBeInTheDocument();
    await user.click(lyricsBtn);

    expect(
      screen.getByRole("heading", { name: /lyrics/i })
    ).toBeInTheDocument();
  });
});
