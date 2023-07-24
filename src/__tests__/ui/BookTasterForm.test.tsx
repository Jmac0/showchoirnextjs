import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";

import BookTasterForm from "@/src/components/forms/BookTasterForm";
import { server } from "@/src/mocks/server";
/// some comment about this
describe("Book Taster Form Component", () => {
  it("should render all form elements", () => {
    render(<BookTasterForm />);
    // find 3 text inputs
    expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /choose a choir/i })
    ).toBeInTheDocument();

    // find button
    expect(screen.getByRole("button", { name: /^book/i })).toBeInTheDocument();
  });

  it("should display a success message when the user submits a valid form", async () => {
    render(<BookTasterForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: /^book/i });

    const firstNameInput = screen.getByLabelText(/^first name/i);
    const lastNameInput = screen.getByLabelText(/^last name/i);
    const emailInput = screen.getByLabelText(/^email/i);
    // const optionInput = screen.getByLabelText(/^location/i);
    const dropdown = screen.getByLabelText("Location *");

    await user.type(firstNameInput, "John");

    await user.type(lastNameInput, "Smith");
    await user.type(emailInput, "john@example.com");
    await user.selectOptions(dropdown, ["option2"]);
    await user.click(submitButton);

    const alert = await screen.findByText("Your mock session is booked");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-green-600 bg-green-300 text-green-600");
  });
});

it(
  "displays validation errors when the submit button is clicked without" +
    "user input",
  async () => {
    render(<BookTasterForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: /^book/i });

    await user.click(submitButton);

    // find 4 alert messages
    const firstNameAlert = await screen.findByText(
      /Please enter your first name/i
    );
    const lastNameAlert = await screen.findByText(
      /Please enter your last name/i
    );
    const emailAlert = await screen.findByText(/Please enter your email/i);
    const locationAlert = await screen.findByText(/Please choose a choir/i);
    expect(firstNameAlert).toBeInTheDocument();
    expect(lastNameAlert).toBeInTheDocument();
    expect(emailAlert).toBeInTheDocument();
    expect(locationAlert).toBeInTheDocument();
  }
);
it(
  "Displays validation errors when user input in invalid and user" +
    " input is retained",
  async () => {
    render(<BookTasterForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: /^book/i });

    const firstNameInput = screen.getByLabelText(/^first name/i);
    const lastNameInput = screen.getByLabelText(/^last name/i);
    const emailInput = screen.getByLabelText(/^email/i);
    const optionInput = screen.getByRole("option", {
      name: /choose a choir/i,
    });

    await user.type(firstNameInput, "ab");

    await user.type(lastNameInput, "ab");
    await user.type(emailInput, "ab");
    await user.type(optionInput, "option 1");

    await user.click(submitButton);
    const firstNameValidationAlert = await screen.findByText(
      /first name be at least 3 characters long/i
    );

    const lastNameValidationAlert = screen.getByText(
      /last name must be at least 3 characters long/i
    );

    const emailValidationAlert = screen.getByText(
      /Please check your email address/i
    );
    expect(firstNameValidationAlert).toBeInTheDocument();
    expect(lastNameValidationAlert).toBeInTheDocument();
    expect(emailValidationAlert).toBeInTheDocument();
    expect(firstNameInput).toHaveValue("ab");
    expect(lastNameInput).toHaveValue("ab");
    expect(emailInput).toHaveValue("ab");
  }
);

it("should display the correct error message when the user request to book a session is rejected", async () => {
  server.resetHandlers(
    rest.post(
      "http://localhost:3000/api/mailchimp/bookTasterSession",
      (req, res, ctx) => {
        const message = "It looks like you have already booked a taster";
        return res(ctx.status(401), ctx.json({ message }));
      }
    )
  );

  render(<BookTasterForm />);
  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: /^book/i });

  const firstNameInput = screen.getByLabelText(/^first name/i);
  const lastNameInput = screen.getByLabelText(/^last name/i);
  const emailInput = screen.getByLabelText(/^email/i);
  // const optionInput = screen.getByLabelText(/^location/i);
  const dropdown = screen.getByLabelText("Location *");

  await user.type(firstNameInput, "John");

  await user.type(lastNameInput, "Smith");
  await user.type(emailInput, "john@example.com");
  await user.selectOptions(dropdown, ["option2"]);
  await user.click(submitButton);

  const alert = await screen.findByText(
    "It looks like you have already booked a taster"
  );
  expect(alert).toBeInTheDocument();
  expect(alert).toHaveClass("border-red-900 bg-red-400 text-red-900");
});
