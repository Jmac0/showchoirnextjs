import { rest } from "msw";

export const handlers = [
  rest.post(
    "http://localhost:3000/api/mailchimp/bookTasterSession",
    (req, res, ctx) =>
      res(
        ctx.json({
          message: "Your mock taster session is booked ",
        })
      )
  ),
];
