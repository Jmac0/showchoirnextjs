import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";

import CreateAccountForm from "@/src/components/forms/CreateAccountForm";
import { server } from "@/src/mocks/server";

describe("Create Account Form", () => {
  it("Should display all elements correctly on initial render", () => {
    render(<CreateAccountForm />);
    expect(
      screen.getByRole("heading", { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(
      screen.getByLabelText("Password", { exact: true })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Confirm Password", { exact: true })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();

    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("should display a success message when the form is submitted & password successfully is created", async () => {
    render(<CreateAccountForm />);
    const user = userEvent.setup();
    const passwordConfirmInput = screen.getByLabelText("Confirm Password", {
      exact: true,
    });
    const passwordInput = screen.getByLabelText("Password", {
      exact: true,
    });
    const button = screen.getByRole("button", { name: /create account/i });

    await user.type(passwordInput, "test");
    await user.type(passwordConfirmInput, "test");
    await user.click(button);
    const alert = await screen.findByText("Password successfully created");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-green-600 bg-green-300 text-green-600");
  });

  it("should render correct error alerts when form is submitted and all fields are empty", async () => {
    render(<CreateAccountForm />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /create account/i });

    await user.click(button);
    await screen.findByText(/please enter a password/i);
    await screen.findByText(/please confirm your password/i);
  });
  it("should render correct error messages when password is too short", async () => {
    render(<CreateAccountForm />);
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText("Password", {
      exact: true,
    });
    const button = screen.getByRole("button", { name: /create account/i });

    await user.type(passwordInput, "abc");
    await user.click(button);
    await screen.findByText(/Password be at least 4 characters long/i);
  });

  it("should render correct error messages when passwords do not match", async () => {
    render(<CreateAccountForm />);
    const user = userEvent.setup();
    const passwordConfirmInput = screen.getByLabelText("Confirm Password", {
      exact: true,
    });
    const passwordInput = screen.getByLabelText("Password", {
      exact: true,
    });
    const button = screen.getByRole("button", { name: /create account/i });

    await user.type(passwordInput, "abcd");
    await user.type(passwordConfirmInput, "abcdefg");
    await user.click(button);
    await screen.findByText(/Passwords do not match/i);
  });
  it("should display an error message when the form is submitted and the user already has a password set", async () => {
    render(<CreateAccountForm />);
    server.resetHandlers(
      rest.post(
        "http://localhost/api/members/createpassword",
        (req, res, ctx) => {
          const message = "User already has a password set";
          return res(ctx.status(401), ctx.json({ message }));
        }
      )
    );
    const user = userEvent.setup();
    const passwordConfirmInput = screen.getByLabelText("Confirm Password", {
      exact: true,
    });
    const passwordInput = screen.getByLabelText("Password", {
      exact: true,
    });
    const button = screen.getByRole("button", { name: /create account/i });

    await user.type(passwordInput, "test");
    await user.type(passwordConfirmInput, "test");
    await user.click(button);
    const alert = await screen.findByText("User already has a password set");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-red-900 bg-red-400 text-red-900");
  });
});
