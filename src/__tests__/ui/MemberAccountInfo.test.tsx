import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MemberAccountInfo } from "@/src/components/members/MemberAccountInfo";

// The component reads ?topup= from the URL to show the payment message
jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, pathname: "/members/dashboard" }),
}));

describe("Member Account Info Component", () => {
  it("Should show a flexi member's details, sessions ring and buy card", async () => {
    const user = userEvent.setup();
    render(
      <MemberAccountInfo
        userData={{
          first_name: "Jamie",
          email: "test@test.com",
          membership_type: "flexi",
          flexi_sessions: 7,
          active_mandate: false,
        }}
      />
    );
    expect(
      screen.getByRole("heading", { name: /welcome jamie/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Flexi")).toBeInTheDocument();
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /7 flexi sessions left/i })
    ).toBeInTheDocument();

    // The buy card starts closed - just the button to open it
    expect(screen.queryByRole("button", { name: /buy now/i })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: /get more flexi sessions/i })
    );

    // Open: the form
    expect(
      screen.getByRole("heading", { name: /get more flexi sessions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /buy now/i })
    ).toBeInTheDocument();

    // Close folds it away again
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(screen.queryByRole("button", { name: /buy now/i })).toBeNull();
  });

  it("Should show Direct Debit status and no buy form for an active mandate", () => {
    render(
      <MemberAccountInfo
        userData={{
          first_name: "Dan",
          email: "dd.active@example.com",
          membership_type: "DD",
          flexi_sessions: 0,
          active_mandate: true,
        }}
      />
    );
    expect(screen.getByText("Direct Debit")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /sessions/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /get more flexi sessions/i })
    ).toBeNull();
  });
});
