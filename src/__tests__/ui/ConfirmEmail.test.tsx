import { fireEvent, render, screen } from "@testing-library/react";
import axios from "axios";

import ConfirmEmail from "@/src/pages/account/confirm-email";

jest.mock("axios");
jest.mock("next/router", () => ({
  useRouter: () => ({ isReady: true, query: { token: "abc" } }),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
  signOut: jest.fn(),
}));

describe("Confirm new email page", () => {
  beforeEach(() => jest.clearAllMocks());

  // Email apps and link checkers open the link by themselves - that mustn't
  // use it up
  it("should not change the email just by opening the link", () => {
    render(<ConfirmEmail />);
    expect(axios.post).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /confirm my new email/i })
    ).toBeInTheDocument();
  });

  it("should change it when the button is pressed", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { email: "new@example.com" },
    });
    render(<ConfirmEmail />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(await screen.findByText(/email changed/i)).toBeInTheDocument();
    expect(axios.post).toHaveBeenCalledWith("/api/members/confirm-email", {
      token: "abc",
    });
  });
});
