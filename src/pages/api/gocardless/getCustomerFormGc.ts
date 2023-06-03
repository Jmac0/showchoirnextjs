/* eslint-disable  @typescript-eslint/no-var-requires */
/* eslint-disable camelcase */
import { NextApiRequest, NextApiResponse } from "next";

const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const client = gocardlessClient();
  // Get the customer info details from GoCardles
  const newCustomer = await client.customers.find(request.body.customerId);
  response.status(200).json(newCustomer);
};
export default handler;

export const gocardlessClient = () =>
  gocardless(
    process.env.GO_CARDLESS_ACCESS_TOKEN,
    // Change this to constants.Environments.Live when you're ready to go live
    constants.Environments.Sandbox
  );
