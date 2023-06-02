import { tr } from "date-fns/esm/locale";
/* eslint-disable  @typescript-eslint/no-var-requires */
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";

const Members = require("../../../lib/models/member");
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  await dbConnect();
  const { customerNumber } = request.body;

  const client = gocardlessClient();
  const customer = await client.customers.find(customerNumber);

  await Members.findOneAndUpdate(
    { email: customer.email },
    { active_mandate: true },
    { new: true }
  );

  console.log("CUSTOMER NUMBER", customerNumber);
  response.json("ok");
};
export default handler;

export const gocardlessClient = () =>
  gocardless(
    process.env.GO_CARDLESS_ACCESS_TOKEN,
    // Change this to constants.Environments.Live when you're ready to go live
    constants.Environments.Sandbox
  );
