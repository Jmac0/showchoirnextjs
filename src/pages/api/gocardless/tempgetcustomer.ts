/* eslint-disable  @typescript-eslint/no-var-requires */
import { NextApiRequest, NextApiResponse } from "next";

const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const { customerNumber } = request.body;

  const client = gocardlessClient();
  const customer = await client.customers.find(customerNumber);

  response.json({ customer });
};
export default handler;

export const gocardlessClient = () =>
  gocardless(
    process.env.GO_CARDLESS_ACCESS_TOKEN,
    // Change this to constants.Environments.Live when you're ready to go live
    constants.Environments.Sandbox
  );
