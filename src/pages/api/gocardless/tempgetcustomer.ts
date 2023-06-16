/* eslint-disable  @typescript-eslint/no-var-requires */
/* eslint-disable camelcase */
import { format } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";

const Members = require("../../../lib/models/member");
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  await dbConnect();
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const client = gocardlessClient();
  const { customer, mandate_request_mandate } =
    request.body.gocardlessCustomerLinks;
  // check that the customer property is present in the request body
  if (customer) {
    // Get the customer info details from GoCardles
    const newCustomer = await client.customers.find(customer);
    console.log(newCustomer);
    // Up date customer in DB
    await Members.findOneAndUpdate(
      { email: newCustomer.email },
      {
        active_mandate: true,
        mandate: mandate_request_mandate,
        go_cardless_id: customer,
        direct_debit_started: currentDate,
      },
      { new: true }
    );
  }
  response.json("ok");
};
export default handler;

export const gocardlessClient = () =>
  gocardless(
    process.env.GO_CARDLESS_ACCESS_TOKEN,
    // Change this to constants.Environments.Live when you're ready to go
    // live
    constants.Environments.Sandbox
  );
