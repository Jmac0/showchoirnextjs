/* eslint-disable camelcase */
/* eslint-disable  @typescript-eslint/no-var-requires  */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { format } from "date-fns";
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import type { GocardlessWebhookEvent } from "@/src/types/types";

const Members = require("../../../lib/models/member");
const constants = require("gocardless-nodejs/constants");
const gocardless = require("gocardless-nodejs");
const webhooks = require("gocardless-nodejs/webhooks");

const client = gocardless(
  process.env.GO_CARDLESS_ACCESS_TOKEN,
  constants.Environments.Sandbox
);
const webhookEndpointSecret = process.env.GC_WEBHOOK_SECRET;
/* 🛑 REMEMBER TO START NGROK FOR LOCAL TESTING */
// Function with switch block to handle incoming events from Gocardless
// const processEvents = async (event: GocardlessWebhookEvent) => {
//   // date-fns date string
//   // get details of customer from go cardless
//   switch (event.action) {
//     //* * handle canceled mandate **//
//
//     case "cancelled": {
//       const canceledCustomer = await getCustomerFromGoCardless(event);
//       await Members.findOneAndUpdate(
//         { email: `${canceledCustomer.email}` },
//         { active: false }
//       ).catch((err: { message: string }) => {
//         throw new Error(err.message);
//       });
//       break;
//     }
//     /* Handle new customer sign up  */
//     // was created but did not get mandate
//     case "fulfilled": {
//       // Once the subscription has been setup, 'fulfilled' will be sent
//       // from Gocardless and then we can update the customer record in
// the DB const newCustomer = await
// client.customers.find(event.links.customer); await
// Members.findOneAndUpdate( { email: `${newCustomer.email}` }, {
// active_mandate: true, direct_debit_started: currentDate, mandate:
// event.links.mandate_request_mandate, go_cardless_id:
// event.links.customer, } ).catch(() => { throw new Error("Error writing
// to database"); });  break; } default: return null; } return null; };

const addGocardlessRecordsToCustomer = async (gocardlessCustomerLinks: {
  customer: string;
  mandate_request_mandate: string;
}) => {
  console.log("CALLED ADD CUSTOMER", gocardlessCustomerLinks);
  // const currentDate = format(new Date(), "dd/MM/yyyy");
  // check that the customer property is present in the request body
  // Get the customer info details from GoCardles
  axios
    .post(
      "https://showchoirnextjs-git-gocardlesswebhooks-jmac0.vercel.app/api/gocardless/getCustomerFromGc",
      {
        customerId: gocardlessCustomerLinks.customer,
      }
    )
    .then(async (response: any) => {
      console.log(response.data);
      await Members.findOneAndUpdate(
        { email: response.data.email },
        {
          active_mandate: true,
          mandate: gocardlessCustomerLinks.mandate_request_mandate,
          go_cardless_id: gocardlessCustomerLinks.customer,
          direct_debit_started: "today",
        },
        { new: true }
      );
    });
  // Up date customer in DB
};

// Handle the coming Webhook and check its signature.
const parseEvents = (
  eventsRequestBody: any,
  signatureHeader: any // From webhook header
) => {
  try {
    return webhooks.parse(
      eventsRequestBody,
      webhookEndpointSecret,
      signatureHeader
    );
  } catch (error) {
    if (error instanceof webhooks.InvalidSignatureError) {
      /* eslint-disable no-console */
      console.log("invalid signature, look out!");
    }
  }
  return null;
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  // get raw body as string
  const body = (await buffer(req)).toString();
  // get signature from headers
  const signature = req.headers["webhook-signature"]?.toString();
  // check signature and if ok return array of events
  const eventsArray = parseEvents(body, signature);
  // if array pass to event to appropriate handler
  if (eventsArray) {
    eventsArray.forEach(async (event: GocardlessWebhookEvent) => {
      if (event.action === "fulfilled" && event.links.customer) {
        await addGocardlessRecordsToCustomer(event.links);
      }
    });
  }

  res.status(200).json("ok");
}
// turn off body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
