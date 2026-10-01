import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChangePasswordForm } from "@/src/components/members/ChangePasswordForm";

describe("Change Password Form", () => {
  it("Should start closed and open to show the password fields", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm className="" />);

    expect(screen.queryByLabelText(/current password/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: /change password/i }));

    expect(screen.getByLabelText(/current password/i)).toHaveAttribute(
      "type",
      "password"
    );
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("Should show errors when the form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm className="" />);
    await user.click(screen.getByRole("button", { name: /change password/i }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    await screen.findByText(/please enter your current password/i);
    await screen.findByText(/please enter a new password/i);
    await screen.findByText(/please confirm your new password/i);
  });

  it("Should show an error when the new passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm className="" />);
    await user.click(screen.getByRole("button", { name: /change password/i }));
    await user.type(screen.getByLabelText(/current password/i), "oldpass");
    await user.type(screen.getByLabelText("New password"), "newpass1");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpass2");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await screen.findByText(/passwords do not match/i);
  });
});
