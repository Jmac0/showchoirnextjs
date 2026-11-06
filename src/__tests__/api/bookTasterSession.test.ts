import { testApiHandler } from "next-test-api-route-handler";

import bookTasterSession from "@/src/pages/api/mailchimp/bookTasterSession";

// Stand-in for the Contentful choir list the API checks the choir against
jest.mock("../../lib/contentfulClient", () => ({
  getChoirVenues: jest.fn().mockResolvedValue([
    { location: "Show Choir Dorking", order: 1 },
    { location: "Show Choir Walton on Thames", order: 2 },
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
  it("tags people who book a taster at Walton", async () => {
    const member = await memberSentToMailchimp(
      "Walton on Thames",
      "walton.booker@example.com"
    );
    expect(member.tags).toEqual(["Walton Taster"]);
  });

  it("doesn't tag people who book a taster at another choir", async () => {
    const member = await memberSentToMailchimp(
      "Dorking",
      "dorking.booker@example.com"
    );
    expect(member.tags).toBeUndefined();
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
