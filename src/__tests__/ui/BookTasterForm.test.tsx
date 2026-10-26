import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";

import BookTasterForm from "@/src/components/forms/BookTasterForm";
import { server } from "@/src/mocks/server";
import { mockVenues } from "@/src/mocks/venues";
/// some comment about this
describe("Book Taster Form Component", () => {
  it("should render all form elements", () => {
    render(<BookTasterForm venues={mockVenues} />);
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
    render(<BookTasterForm venues={mockVenues} />);
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
    await user.selectOptions(dropdown, ["Banstead"]);
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
    render(<BookTasterForm venues={mockVenues} />);
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
    render(<BookTasterForm venues={mockVenues} />);
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
  server.use(
    rest.post(
      "http://localhost/api/mailchimp/bookTasterSession",
      (req, res, ctx) => {
        const message = "It looks like you have already booked a taster";
        return res(ctx.status(401), ctx.json({ message }));
      }
    )
  );

  render(<BookTasterForm venues={mockVenues} />);
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
  await user.selectOptions(dropdown, ["Banstead"]);
  await user.click(submitButton);

  const alert = await screen.findByText(
    "It looks like you have already booked a taster"
  );
  expect(alert).toBeInTheDocument();
  expect(alert).toHaveClass("border-red-900 bg-red-400 text-red-900");
});

describe("Holiday banner", () => {
  it("Shows nothing when no holiday is on", async () => {
    render(<BookTasterForm venues={mockVenues} />);
    // Give the holiday check time to come back
    await screen.findByRole("button", { name: /^book/i });
    expect(screen.queryByText(/on holiday/i)).not.toBeInTheDocument();
  });

  it("Says when the choir is back while a holiday is on", async () => {
    server.use(
      rest.get("http://localhost/api/holidays/current", (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ holiday: { back_on: "2026-10-26" } }))
      )
    );
    render(<BookTasterForm venues={mockVenues} />);
    expect(
      await screen.findByText("We are on holiday until Monday 26th October")
    ).toBeInTheDocument();
    server.resetHandlers();
  });
});

it("pre-selects the choir it's given (e.g. on a venue's own page)", async () => {
  render(<BookTasterForm venues={mockVenues} defaultChoir="Leatherhead" />);
  const dropdown = screen.getByRole("combobox");
  // still chosen after the form's first reset
  await waitFor(() => expect(dropdown).toHaveValue("Leatherhead"));
  // and its day, time and address are shown straight away
  expect(screen.getByText("Leatherhead Choir")).toBeInTheDocument();
});
