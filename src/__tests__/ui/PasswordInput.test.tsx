import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PasswordInput } from "@/src/components/forms/PasswordInput";

describe("Password Input", () => {
  it("Should hide the password until the eye button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" />
      </>
    );
    const input = screen.getByLabelText("Password", { exact: true });
    await user.type(input, "secret");

    // Hidden to start with
    expect(input).toHaveAttribute("type", "password");

    // Show it
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("secret");

    // Hide it again
    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
