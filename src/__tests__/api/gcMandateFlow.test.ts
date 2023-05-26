import { testApiHandler } from "next-test-api-route-handler";

import mandateFlowHandler from "@/src/pages/api/gocardless/gcmandateflow";

describe("api/gocardless/gcmandateflow", () => {
  it("POST api/gocardless/mandateflow return 401 when .ru email received", async () => {
    await testApiHandler({
      handler: mandateFlowHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: "John",
            lastName: "Smith",
            streetAddress: "1 The Street",
            townOrCity: "London",
            county: "London",
            postCode: "SW1 AAA",
            email: "john@example.ru",
          }),
        });
        expect(res.status).toBe(401);
        const { message } = await res.json();
        expect(message).toMatch(
          /Please use a valid UK, EU or US email address/i
        );
      },
    });
  });

  it(
    "GET /api/gocardless/gcmandateflow should return 401 when a POST" +
      " method is not used",
    async () => {
      await testApiHandler({
        handler: mandateFlowHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(405);
          const { message } = await res.json();
          expect(message).toBe("Unsupported method");
        },
      });
    }
  );
});
