/** @jest-environment node */
import crypto from "node:crypto";

// A pretend Mailchimp - nothing real is touched
jest.mock("@mailchimp/mailchimp_marketing", () => ({
  setConfig: jest.fn(),
  lists: {
    setListMember: jest.fn(),
    deleteListMember: jest.fn(),
    getListInterestCategories: jest.fn(),
    listInterestCategoryInterests: jest.fn(),
  },
}));

/* eslint-disable import/first */
import { joinChoirAudience, leaveChoirAudience } from "@/src/lib/mailchimp";
/* eslint-enable import/first */

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const mockLists = require("@mailchimp/mailchimp_marketing").lists as Record<
  string,
  jest.Mock
>;

const member = {
  email: "Ann@Example.com",
  first_name: "Ann",
  last_name: "Singer",
  home_choir: "Dorking",
};
const hash = crypto.createHash("md5").update("ann@example.com").digest("hex");

beforeEach(() => {
  jest.clearAllMocks();
  process.env.MAILCHIMP_LIST_ID = "PROSPECTS";
  process.env.MAILCHIMP_CHOIR_LIST_ID = "CHOIR";
  mockLists.getListInterestCategories.mockResolvedValue({
    categories: [{ id: "cat1" }],
  });
  mockLists.listInterestCategoryInterests.mockResolvedValue({
    interests: [{ id: "dorking-id", name: "Dorking" }],
  });
});

describe("Mailchimp audiences", () => {
  it("Should add a new member to Choir (subscribed only if new, with their choir group) and archive them in Prospects", async () => {
    expect(await joinChoirAudience(member)).toBe(true);

    expect(mockLists.setListMember).toHaveBeenCalledWith("CHOIR", hash, {
      email_address: "Ann@Example.com",
      // keeps anyone who unsubscribed unsubscribed
      status_if_new: "subscribed",
      merge_fields: { FNAME: "Ann", LNAME: "Singer" },
      interests: { "dorking-id": true },
    });
    expect(mockLists.deleteListMember).toHaveBeenCalledWith("PROSPECTS", hash);
  });

  it("Should move someone whose membership ended back to Prospects and archive them in Choir", async () => {
    expect(await leaveChoirAudience(member)).toBe(true);
    expect(mockLists.setListMember.mock.calls[0][0]).toBe("PROSPECTS");
    expect(mockLists.deleteListMember).toHaveBeenCalledWith("CHOIR", hash);
  });

  it("Should be fine if they weren't in the audience being left", async () => {
    mockLists.deleteListMember.mockRejectedValue({ status: 404 });
    expect(await joinChoirAudience(member)).toBe(true);
  });

  it("Should never throw on a Mailchimp problem - just report it didn't work", async () => {
    mockLists.setListMember.mockRejectedValue(new Error("Mailchimp is down"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await joinChoirAudience(member)).toBe(false);
    expect(mockLists.deleteListMember).not.toHaveBeenCalled();
  });

  it("Should do nothing at all when the Choir audience isn't set (development)", async () => {
    delete process.env.MAILCHIMP_CHOIR_LIST_ID;
    expect(await joinChoirAudience(member)).toBe(false);
    expect(mockLists.setListMember).not.toHaveBeenCalled();
    expect(mockLists.deleteListMember).not.toHaveBeenCalled();
  });
});
