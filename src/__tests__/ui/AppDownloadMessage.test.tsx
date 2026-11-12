import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import { AppDownloadMessage } from "../../components/members/AppDownloadMessage";

describe("AppDownloadMessage", () => {
  beforeEach(() => localStorage.clear());

  it("shows the app link until Got it! is pressed, then stays hidden", () => {
    const { unmount } = render(<AppDownloadMessage />);
    expect(screen.getByRole("link", { name: /google play/i })).toHaveAttribute(
      "href",
      expect.stringContaining("id=co.uk.showchoir.app")
    );

    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByText(/next step/i)).not.toBeInTheDocument();
    unmount();

    // logging in again in the same browser - still dismissed
    render(<AppDownloadMessage />);
    expect(screen.queryByText(/next step/i)).not.toBeInTheDocument();
  });
});
