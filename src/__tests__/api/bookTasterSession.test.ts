import { testApiHandler } from "next-test-api-route-handler";

import bookTasterSession from "@/src/pages/api/mailchimp/bookTasterSession";

describe("api/addProspectToMailchimp", () => {
  it(
    "GET: api/addProspectToMailchimp should return a 401 error with" +
      " method not supported if the request method is not POST ",
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
