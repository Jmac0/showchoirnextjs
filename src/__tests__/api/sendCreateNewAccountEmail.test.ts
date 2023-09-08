/** @jest-environment node */
import * as mongoose from "mongoose";
import { testApiHandler } from "next-test-api-route-handler";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import sendCreateNewAccountEmail from "@/src/pages/api/signup/sendCreateNewAccountEmail";
// create dummy member record to test against, delivered@resend.dev
// is from Resend and allows test emails to be sent and returns a valid email ID
const mockMember = {
  first_name: "John",
  last_name: "Smith",
  email: "delivered@resend.dev",
  phone_number: "09876786544",
};

describe("api/sendCreateNewAccountEmail", () => {
  // setup test database to have a valid user email
  beforeAll(async () => {
    await dbConnect();
    await Members.create(mockMember);
  });

  afterAll(async () => {
    await Members.deleteMany();
    await mongoose.disconnect();
  });
  it("Should return a 200 response and an id when a valid user email is sent", async () => {
    await testApiHandler({
      handler: sendCreateNewAccountEmail,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullDocument: {
              first_name: "Test",
              email: "delivered@resend.dev",
            },
          }),
        });
        expect(res.status).toBe(200);
        const response = await res.json();
        // Resend service sends an ID if the email is delivered
        expect(response).toHaveProperty("id");
      },
    });
  });
  it("Should return a 401 status and a user not found message when an invalid email is sent ", async () => {
    await testApiHandler({
      handler: sendCreateNewAccountEmail,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullDocument: {
              first_name: "Test",
              email: "unkown@resend.dev",
            },
          }),
        });
        expect(res.status).toBe(404);
        const { message } = await res.json();
        expect(message).toBe("User not found");
      },
    });
  });
});
