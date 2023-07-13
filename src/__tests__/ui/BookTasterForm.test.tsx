import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BookTasterForm from "@/src/components/forms/BookTasterForm";

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

  it(
    "should display a success message when the user submits a" +
      " correct form",
    async () => {
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
    }
  );

  it("displays validation errors submit is clicked without user input", async () => {
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
  });
  it("Displays validation errors when user input in invalid", async () => {
    render(<BookTasterForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: /^book/i });

    const firstNameInput = screen.getByLabelText(/^first name/i);
    const lastNameInput = screen.getByLabelText(/^last name/i);
    const emailInput = screen.getByLabelText(/^email/i);
    const optionInput = screen.getByRole("option", { name: /choose a choir/i });

    await user.type(firstNameInput, "a");

    await user.type(lastNameInput, "a");
    await user.type(emailInput, "p");
    await user.type(optionInput, "option 1");

    await user.click(submitButton);
    const firstNameValidationAlert = await screen.findByText(
      /first name be at least 3 characters long/i
    );

    const lastNameValidationAlert = screen.getByText(
      /last name must be at least 3 characters long/i
    );

    const emaiValidationAlert = screen.getByText(
      /Please check your email address/i
    );
    expect(firstNameValidationAlert).toBeInTheDocument();
    expect(lastNameValidationAlert).toBeInTheDocument();
    expect(emaiValidationAlert).toBeInTheDocument();
  });
});
