import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewMemberSignUpForm } from "@/src/components/forms/NewMemberSignupForm";
import { mockVenues } from "@/src/mocks/venues";

// const mockSubmit = jest.fn();
describe("NewMemberSignUpForm", () => {
  it("should render a heading, all inputs a button, zero alerts should be visible ", () => {
    render(
      <NewMemberSignUpForm
        showFlexiOptions={false}
        venues={mockVenues}
        isErrorMessage={false}
        loading={false}
        message=""
        showUserMessage={false}
        submitForm={jest.fn()}
      />
    );
    expect(
      screen.getByRole("heading", { name: /join the fun!/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^first name */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^last name */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^street address */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^town\/city */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^county */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^post Code */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone number */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^home choir */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^I am over 18 */i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^I agree */i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("Call the mock submit function and show loading button when the form is correctly filled in ", async () => {
    const user = userEvent.setup();
    const mockHandleSubmit = jest.fn();
    render(
      <NewMemberSignUpForm
        showFlexiOptions={false}
        venues={mockVenues}
        isErrorMessage={false}
        loading={false}
        message=""
        showUserMessage={false}
        submitForm={mockHandleSubmit}
      />
    );
    expect(
      screen.getByRole("heading", { name: /join the fun!/i })
    ).toBeInTheDocument();
    const firstNameInput = screen.getByLabelText(/^first name */i);
    const lastNameInput = screen.getByLabelText(/^last name */i);
    const streetInput = screen.getByLabelText(/^street address */i);
    const townInput = screen.getByLabelText(/^town\/city */i);
    const countyInput = screen.getByLabelText(/^county */i);
    const postCodeInput = screen.getByLabelText(/^post Code */i);
    const phoneInput = screen.getByLabelText(/^phone number */i);
    const emailInput = screen.getByLabelText(/^email */i);
    const homeChoirDropDown = screen.getByLabelText(/^home choir */i);
    const ageConfirmInput = screen.getByLabelText(/^I am over 18 */i);
    const consentInput = screen.getByLabelText(/^I agree */i);
    const button = screen.getByRole("button", { name: /next/i });

    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Smith");
    await user.type(streetInput, "1 The Street");
    await user.type(townInput, "Town");
    await user.type(countyInput, "Home County");
    await user.type(postCodeInput, "SW14AG");
    await user.type(phoneInput, "07976942976");
    await user.type(emailInput, "test@test.com");
    // Different capitals/spaces still count as the same email
    await user.type(
      screen.getByLabelText(/^confirm email */i),
      " Test@test.com"
    );
    await user.selectOptions(homeChoirDropDown, ["Leatherhead"]);
    await user.click(ageConfirmInput);
    await user.click(consentInput);
    await user.click(button);

    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    // The confirmation is only for checking - it isn't sent on
    expect(mockHandleSubmit.mock.calls[0][0]).not.toHaveProperty(
      "confirmEmail"
    );
  });

  it("Should not submit if the two emails don't match", async () => {
    const user = userEvent.setup();
    const mockHandleSubmit = jest.fn();
    render(
      <NewMemberSignUpForm
        showFlexiOptions={false}
        venues={mockVenues}
        isErrorMessage={false}
        loading={false}
        message=""
        showUserMessage={false}
        submitForm={mockHandleSubmit}
      />
    );
    await user.type(screen.getByLabelText(/^email */i), "test@test.com");
    await user.type(
      screen.getByLabelText(/^confirm email */i),
      "test@tset.com"
    );
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText("Emails do not match")).toBeInTheDocument();
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });
  it("Should display an alert message for each input if the form is submitted without any user input", async () => {
    const user = userEvent.setup();
    const mockHandleSubmit = jest.fn();
    render(
      <NewMemberSignUpForm
        showFlexiOptions={false}
        venues={mockVenues}
        isErrorMessage={false}
        loading={false}
        message=""
        showUserMessage={false}
        submitForm={mockHandleSubmit}
      />
    );
    const button = screen.getByRole("button", { name: /next/i });
    await user.click(button);
    expect(await screen.findAllByRole("alert")).toHaveLength(12);
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });
});
