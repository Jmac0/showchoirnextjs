import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  MembershipCard,
  membershipQrValue,
} from "@/src/components/members/MembershipCard";

describe("Membership card QR code contents", () => {
  it("Should match the app's QR code exactly, so the GA scanner reads both", () => {
    // Same as the app: JSON.stringify({ email, first_name, last_name })
    expect(membershipQrValue("test@test.com", "Jamie", "Mac")).toBe(
      '{"email":"test@test.com","first_name":"Jamie","last_name":"Mac"}'
    );
  });
});

describe("Membership Card Component", () => {
  it("Should display a heading, QR code, button, text box and call the print function", async () => {
    const user = userEvent.setup();
    const handlePrint = jest.fn();
    render(<MembershipCard email="test@test.com" handlePrint={handlePrint} />);
    expect(screen.getAllByRole("heading", { name: /membership card/i }));
    expect(screen.getByTestId("qr")).toBeInTheDocument();
    expect(screen.getByText(/^If you would like/i)).toBeInTheDocument();
    const printBtn = screen.getByRole("button", { name: /print card/i });
    await user.click(printBtn);
    expect(handlePrint).toHaveBeenCalled();
  });
});
