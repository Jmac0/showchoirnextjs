import { testApiHandler } from "next-test-api-route-handler";

import { resetSpamCounts } from "@/src/lib/helpers/formSpamCheck";
import bookTasterSession from "@/src/pages/api/mailchimp/bookTasterSession";

// Stand-in for the Contentful choir list the API checks the choir against
jest.mock("../../lib/contentfulClient", () => ({
  getChoirVenues: jest.fn().mockResolvedValue([
    { location: "Show Choir Banstead", order: 1 },
    { location: "Show Choir Cobham", order: 2 },
    { location: "Show Choir Dorking", order: 3 },
    { location: "Show Choir Leatherhead", order: 4 },
    { location: "Show Choir Walton on Thames", order: 5 },
    { location: "Show Choir West Byfleet", order: 6 },
    // A choir just added in Contentful, with no tag set up yet
    { location: "Show Choir Newtown", order: 7 },
  ]),
}));

// Stand-in so a booking can go all the way through without touching Mailchimp
jest.mock("@mailchimp/mailchimp_marketing", () => ({
  setConfig: jest.fn(),
  lists: {
    addListMember: jest.fn().mockResolvedValue({}),
    getListInterestCategories: jest.fn().mockResolvedValue({ categories: [] }),
  },
}));

jest.mock("../../lib/metaConversions", () => ({
  ...jest.requireActual("../../lib/metaConversions"),
  sendMetaEvent: jest.fn().mockResolvedValue(undefined),
}));

// What was sent to Mailchimp after booking a taster at this choir
async function memberSentToMailchimp(location: string, email: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const mailchimp = require("@mailchimp/mailchimp_marketing");
  mailchimp.lists.addListMember.mockClear();
  await testApiHandler({
    handler: bookTasterSession,
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "John",
          lastName: "Smith",
          email,
          location,
          // long enough ago for the spam check to believe a person typed it
          elapsed_ms: 60000,
        }),
      });
      expect(res.status).toBe(200);
    },
  });
  return mailchimp.lists.addListMember.mock.calls[0][1];
}

describe("api/addProspectToMailchimp", () => {
  // The form allows so many bookings an hour from one address, and these tests
  // all come from the same one
  beforeEach(() => {
    resetSpamCounts();
  });

  it.each([
    ["Banstead", "Banstead Taster"],
    ["Cobham", "Cobham Taster"],
    ["Dorking", "Dorking Taster"],
    ["Leatherhead", "Leatherhead Taster"],
    ["Walton on Thames", "Walton Taster"],
    ["West Byfleet", "West Byfleet Taster"],
  ])("tags people who book a taster at %s", async (choir, tag) => {
    const member = await memberSentToMailchimp(
      choir,
      `${choir.replace(/ /g, ".").toLowerCase()}.booker@example.com`
    );
    expect(member.tags).toEqual([tag]);
  });

  it("still books a choir that has no tag set up, without a tag", async () => {
    const member = await memberSentToMailchimp(
      "Newtown",
      "newtown.booker@example.com"
    );
    expect(member.tags).toBeUndefined();
  });

  it("tells Meta about a booking only if they accepted cookies", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { sendMetaEvent } = require("../../lib/metaConversions");
    const book = (extra: object) =>
      testApiHandler({
        handler: bookTasterSession,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: "John",
              lastName: "Smith",
              email: "meta.booker@example.com",
              location: "Dorking",
              elapsed_ms: 60000,
              ...extra,
            }),
          });
          expect(res.status).toBe(200);
        },
      });

    sendMetaEvent.mockClear();
    await book({});
    expect(sendMetaEvent).not.toHaveBeenCalled();

    await book({ metaConsent: true, fbp: "fb.1.1.1" });
    expect(sendMetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "Lead",
        email: "meta.booker@example.com",
        attribution: expect.objectContaining({ fbp: "fb.1.1.1" }),
      })
    );
  });

  it(
    "GET: api/addProspectToMailchimp should return a 401 error with" +
      "method not supported if the request method is not POST ",
    async () => {
      await testApiHandler({
        handler: bookTasterSession,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "GET",
          });
          expect(res.status).toBe(401);
          const { message } = await res.json();
          expect(message).toMatch(/method is not supported/i);
        },
      });
    }
  );
  it(
    "POST: api/addProspectToMailchimp should return an error message" +
      " when an email with a .ru is posted",
    async () => {
      await testApiHandler({
        handler: bookTasterSession,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: "John",
              lastName: "Smith",
              email: "test@example.ru",
            }),
          });
          expect(res.status).toBe(400);
          const { message } = await res.json();
          expect(message).toMatch(/Please enter a valid email/i);
        },
      });
    }
  );

  it(
    "should return a 401 error message when the posed requests" +
      " firstName and lastName fields values are the same ",
    async () => {
      await testApiHandler({
        handler: bookTasterSession,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: "Test",
              lastName: "Test",
              email: "test@example.com",
            }),
          });
          expect(res.status).toBe(401);
          const { message } = await res.json();
          expect(message).toMatch(
            /first name must be different from last name/i
          );
        },
      });
    }
  );
});
