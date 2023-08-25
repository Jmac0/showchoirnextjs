import { defineConfig } from "cypress";

import dbConnect from "./src/lib/dbConnect";
import Members from "./src/lib/models/member";

const mockMemberData = {
  first_name: "John",
  last_name: "Smith",
  email: "test@test.com",
};

export default defineConfig({
  // setupNodeEvents can be defined in either
  // the e2e or component configuration
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        "db:seed": async function (mockMemberData) {
          await dbConnect();
          // seed database with test data
          const data = Members.create(mockMemberData);
          return data;
        },
      });
      on("task", {
        "db:reset": async function () {
          await dbConnect();
          // reset database test data
          const data = await Members.deleteMany();
          return data;
        },
      });
      on("after:run", async () => {
        await dbConnect();
        // seed database with test data
        const data = Members.deleteMany();
        return data;
        /* ... */
      });
    },
  },
});
