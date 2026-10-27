import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { signIn } from "next-auth/react";

import CreateAccountForm from "@/src/components/forms/CreateAccountForm";
import { server } from "@/src/mocks/server";

jest.mock("next-auth/react");
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter() {
    return {
      pathname: "",
      push: mockPush,
    };
  },
}));

// The real API's success reply (the default mock leaves out status: 200)
const passwordCreated = () =>
  server.resetHandlers(
    rest.post("http://localhost/api/signup/createpassword", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({ message: "Password created successfully", status: 200 })
      )
    )
  );

const createPassword = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Password", { exact: true }), "pass1");
  await user.type(
    screen.getByLabelText("Confirm Password", { exact: true }),
    "pass1"
  );
  await user.click(screen.getByRole("button", { name: /create account/i }));
};

describe("Create Account Form", () => {
  beforeEach(() => jest.clearAllMocks());

  it("logs them straight in to their dashboard once the password is saved", async () => {
    passwordCreated();
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });
    render(<CreateAccountForm email="new@test.com" token="abc" />);
    await createPassword();

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/members/dashboard")
    );
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "new@test.com",
      password: "pass1",
      redirect: false,
    });
  });

  it("goes to the sign-in page if logging them in doesn't work", async () => {
    passwordCreated();
    (signIn as jest.Mock).mockResolvedValue({ ok: false, error: "nope" });
    render(<CreateAccountForm email="new@test.com" token="abc" />);
    await createPassword();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/auth/signin"));
  });

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

    await user.type(passwordInput, "testpass1");
    await user.type(passwordConfirmInput, "testpass1");
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

    await user.type(passwordInput, "abcd");
    await user.click(button);
    await screen.findByText(/Password must be at least 5 characters long/i);
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

    await user.type(passwordInput, "abcdefgh");
    await user.type(passwordConfirmInput, "abcdefgXY");
    await user.click(button);
    await screen.findByText(/Passwords do not match/i);
  });
  it("should display an error message when the form is submitted and the user already has a password set", async () => {
    render(<CreateAccountForm />);
    server.resetHandlers(
      rest.post(
        "http://localhost/api/signup/createpassword",
        (req, res, ctx) => {
          const message = "This account already has a password";
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

    await user.type(passwordInput, "testpass1");
    await user.type(passwordConfirmInput, "testpass1");
    await user.click(button);
    const alert = await screen.findByText(
      "This account already has a password"
    );
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-red-900 bg-red-400 text-red-900");
  });
});
