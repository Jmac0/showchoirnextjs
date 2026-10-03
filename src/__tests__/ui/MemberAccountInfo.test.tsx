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

  it("Should offer only a new Direct Debit, not Flexi, when a Direct Debit has stopped", () => {
    render(
      <MemberAccountInfo
        userData={{
          first_name: "Ella",
          email: "dd.cancelled@example.com",
          membership_type: "DD",
          flexi_sessions: 0,
          active_mandate: false,
          direct_debit: {
            ended_at: "2026-08-24T12:00:00.000Z",
            grace_ends_at: "2026-09-07T12:00:00.000Z",
            in_grace_period: false,
            what_happened: "cancelled",
            reason: "",
          },
        }}
      />
    );
    expect(
      screen.getByRole("heading", { name: /your direct debit has stopped/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set up a new direct debit/i })
    ).toBeInTheDocument();
    // Flexi is being phased out - only Flexi members can buy packs
    expect(
      screen.queryByRole("button", { name: /get more flexi sessions/i })
    ).toBeNull();
    expect(screen.queryByText(/flexi sessions/i)).toBeNull();
  });
});
