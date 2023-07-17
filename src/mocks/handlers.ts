import { rest } from "msw";

export const handlers = [
  rest.post(
    "http://localhost:3000/api/mailchimp/bookTasterSession",
    (req, res, ctx) => {
      const message = "Your mock session is booked";
      return res(ctx.status(200), ctx.json({ message }));
    }
  ),
];
