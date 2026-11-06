import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CookieBanner } from "@/src/components/CookieBanner";
import { MetaPixel } from "@/src/components/MetaPixel";
import {
  adTrackingFields,
  getCookieChoice,
  isUntrackedPath,
  openCookieSettings,
} from "@/src/lib/cookieConsent";

let mockAsPath = "/walton";
jest.mock("next/router", () => ({
  useRouter: () => ({ asPath: mockAsPath }),
}));

const clearCookies = () => {
  ["show_choir_cookie_choice", "_fbp", "_fbc"].forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  });
};

beforeEach(() => {
  mockAsPath = "/walton";
  clearCookies();
});

describe("CookieBanner", () => {
  it("asks on a first visit, with Accept and Reject looking the same", () => {
    render(<CookieBanner />);
    const accept = screen.getByRole("button", { name: "Accept" });
    const reject = screen.getByRole("button", { name: "Reject" });
    expect(accept.className).toBe(reject.className);
  });

  it("remembers Accept and stops asking", async () => {
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(getCookieChoice()).toBe("accepted");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears Meta's cookies on Reject", async () => {
    document.cookie = "_fbp=fb.1.1.1; Path=/";
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(getCookieChoice()).toBe("rejected");
    expect(document.cookie).not.toContain("_fbp");
  });

  it("doesn't ask on private pages", () => {
    mockAsPath = "/register/welcome?token=abc";
    render(<CookieBanner />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens again from Cookie settings after a choice", async () => {
    document.cookie = "show_choir_cookie_choice=rejected; Path=/";
    render(<CookieBanner />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => openCookieSettings());
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("isUntrackedPath", () => {
  it.each([
    "/members/dashboard",
    "/account/confirm-email?token=abc",
    "/auth/reset-password?token=abc",
    "/register/create-account?email=abc",
    "/direct-debit-thanks",
  ])("never tracks %s", (path) => {
    expect(isUntrackedPath(path)).toBe(true);
  });

  it.each(["/", "/walton", "/monthly-membership", "/membership-options"])(
    "can track %s",
    (path) => {
      expect(isUntrackedPath(path)).toBe(false);
    }
  );
});

describe("adTrackingFields", () => {
  it("sends nothing before a choice", () => {
    expect(adTrackingFields()).toEqual({});
  });

  it("sends nothing after Reject", () => {
    document.cookie = "show_choir_cookie_choice=rejected; Path=/";
    document.cookie = "_fbp=fb.1.1.1; Path=/";
    expect(adTrackingFields()).toEqual({});
  });

  it("sends consent and Meta's cookies after Accept", () => {
    document.cookie = "show_choir_cookie_choice=accepted; Path=/";
    document.cookie = "_fbp=fb.1.1.1; Path=/";
    expect(adTrackingFields()).toMatchObject({
      metaConsent: true,
      fbp: "fb.1.1.1",
    });
  });
});

describe("MetaPixel", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123";
  });

  it("adds nothing without consent", () => {
    const { container } = render(<MetaPixel />);
    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector("#meta-pixel")).toBeNull();
  });
});
