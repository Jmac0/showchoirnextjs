import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { rest } from "msw";

import CreateAccountForm from "@/src/components/forms/CreateAccountForm";
import { NewMemberSignUpForm } from "@/src/components/forms/NewMemberSignupForm";
import { MetaAudienceSwitch } from "@/src/components/members/MetaAudienceSwitch";
import { server } from "@/src/mocks/server";

jest.mock("next-auth/react");
jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "", push: jest.fn() }),
}));

const tick = () => screen.getByRole("checkbox", { name: /optional/i });

const signUpForm = (existingMember: boolean) => (
  <NewMemberSignUpForm
    existingMember={existingMember}
    loading={false}
    submitForm={jest.fn()}
    message=""
    isErrorMessage={false}
    showUserMessage={false}
    showFlexiOptions={false}
    venues={[]}
  />
);

describe("the optional Meta tick", () => {
  it("is on the invited member's form, unticked", () => {
    render(signUpForm(true));
    expect(tick()).not.toBeChecked();
  });

  it("isn't on the form before someone has paid", () => {
    render(signUpForm(false));
    expect(screen.queryByRole("checkbox", { name: /optional/i })).toBeNull();
  });

  const createAccount = async (ticked: boolean) => {
    let sent: { metaAudienceOptIn?: boolean } = {};
    server.resetHandlers(
      rest.post(
        "http://localhost/api/signup/createpassword",
        async (req, res, ctx) => {
          sent = await req.json();
          return res(ctx.status(200), ctx.json({ message: "ok" }));
        }
      )
    );
    render(<CreateAccountForm email="new@test.com" token="abc" />);
    const user = userEvent.setup();
    expect(tick()).not.toBeChecked();
    if (ticked) await user.click(tick());
    await user.type(screen.getByLabelText("Password"), "a-long-password");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "a-long-password"
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(sent.metaAudienceOptIn).toBe(ticked));
  };

  it("lets a new member create their account without ticking it", async () => {
    await createAccount(false);
  });

  it("sends a new member's yes when they tick it", async () => {
    await createAccount(true);
  });
});

describe("MetaAudienceSwitch", () => {
  afterEach(() => jest.restoreAllMocks());

  it("shows their answer and saves a change of mind", async () => {
    const post = jest.spyOn(axios, "post").mockResolvedValue({});
    render(<MetaAudienceSwitch optedIn />);
    expect(tick()).toBeChecked();
    await userEvent.click(tick());
    expect(post).toHaveBeenCalledWith("/api/members/meta-audience", {
      optIn: false,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
    expect(tick()).not.toBeChecked();
  });

  it("goes back to what's really saved if it fails", async () => {
    jest.spyOn(axios, "post").mockRejectedValue(new Error("offline"));
    render(<MetaAudienceSwitch optedIn />);
    await userEvent.click(tick());
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(tick()).toBeChecked();
  });
});
