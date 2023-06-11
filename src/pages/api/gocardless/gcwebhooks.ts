/* eslint-disable camelcase */
/* eslint-disable  @typescript-eslint/no-var-requires  */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import { buffer } from "micro";

import dbConnect from "@/src/lib/dbConnect";
import type { GocardlessWebhookEvent } from "@/src/types/types";
import type { NextApiRequest, NextApiResponse } from "next";

const Members = require("../../../lib/models/member");
const constants = require("gocardless-nodejs/constants");
const gocardless = require("gocardless-nodejs");
const webhooks = require("gocardless-nodejs/webhooks");
const GcAccessToken = process.env.GO_CARDLESS_ACCESS_TOKEN as string;
const webhookEndpointSecret = process.env.GC_WEBHOOK_SECRET;

// Check .env variables are loaded
if (!GcAccessToken || !webhookEndpointSecret) {
  console.log("Not all .env variables are loaded ‼️ ");
}
// Set of actions to call processEvents with
const webhookActionNames = new Set(["fulfilled", "created"]);
/* 🛑 REMEMBER TO START NGROK FOR LOCAL TESTING */
const client = gocardless(GcAccessToken, constants.Environments.Sandbox);
// Function with switch block to handle incoming events from Gocardless
const updateCustomer = async (event: GocardlessWebhookEvent) => {
  // date-fns date string
  const currentDate = format(new Date(), "dd/MM/yyyy");
  // event action string from Gocardless webhook event
  switch (event.action) {
    case "created":
      //create a new subscription for the customer,
      if (event.links.mandate) {
        await client.subscriptions.create({
          amount: "3000",
          currency: "GBP",
          name: "single_subscription",
          interval_unit: "monthly",
          day_of_month: "1",
          metadata: {
            order_no: "Show_Choir_single_subscription",
          },
          // mandate to create subscription against
          links: {
            mandate: event.links.mandate,
          },
        });
      }

      break;
    /*Handle new customer sign up */
    case "fulfilled":
      /* Once the subscription has been set up, 'fulfilled' will be sent from Gocardless, and then we can
       update the customer record in the DB*/
      const customer = await client.customers.find(event.links.customer);
      console.log("GC CUSTOMER", customer);
      const returnedCustomer = await Members.findOneAndUpdate(
        { email: customer.email },
        {
          active_mandate: true,
          go_cardless_id: customer.id,
        }
      );
      console.log("MONGO RESULT", returnedCustomer);
      break;
    //** handle canceled mandate **//
    case "cancelled":
      // check if there is a mandate number, as the 'cancelled' action is
      // sent from
      // gocardless with and without it
      if (event.links.mandate) {
        // query Go Cardless for the mandate
        const mandate = await client.mandates.find(event.links.mandate);
        // // get Go Cardless customer ID from the mandate object
        const Id = mandate.links.customer;
        // // query Go Cardless for the actual customer details
        const canceledCustomer = await client.customers.find(Id);

        await Members.findOneAndUpdate(
          { email: `${canceledCustomer.email}` },
          {
            active_mandate: false,
            mandate: "",
            go_cardless_id: "",
            direct_debit_cancelled: currentDate,
          }
        ).catch((err: any) => {
          console.log(err);
        });
      }
      break;
    default:
      console.log(event);
      return;
  }
};
//
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
      if (webhookActionNames.has(event.action)) {
        await updateCustomer(event);
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
