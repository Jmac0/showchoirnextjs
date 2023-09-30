import { rest } from "msw";

export const handlers = [
  rest.post(
    "http://localhost:3000/api/mailchimp/bookTasterSession",
    (req, res, ctx) => {
      const message = "Your mock session is booked";
      return res(ctx.status(200), ctx.json({ message }));
    }
  ),
  rest.post("http://localhost/api/signup/createpassword", (req, res, ctx) => {
    const message = "Password successfully created";
    return res(ctx.status(200), ctx.json({ message }));
  }),

  rest.post("http://localhost/api/members/fetch-member", (req, res, ctx) => {
    const mockMemberData = {
      name: "John",
      email: "test@test.com",
      role: "",
      membership_type: "Flexi",
      flexi_sessions: 5,
    };
    return res(ctx.status(200), ctx.json({ member: mockMemberData }));
  }),
];
