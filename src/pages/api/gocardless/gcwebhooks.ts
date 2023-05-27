import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { format } from "date-fns";
import dbConnect from "@/src/lib/dbConnect";
import { MandateType, MemberType } from "@/src/types/types";
import { getCustomerFromGoCardless } from "@/src/lib/helpers/getCutomerGoCardless";
const webhooks = require("gocardless-nodejs/webhooks");
const Members = require("../../../lib/models/member");
const constants = require("gocardless-nodejs/constants");
const gocardless = require("gocardless-nodejs");
const client = gocardless(
  process.env.GO_CARDLESS_ACCESS_TOKEN,
  constants.Environments.Sandbox
);
const webhookEndpointSecret = process.env.GC_WEBHOOK_SECRET;

/*🛑 REMEMBER TO START NGROK FOR LOCAL TESTING*/
// Function with switch block to handle incoming events from Gocardless
const processEvents = async (event: MandateType) => {
  await dbConnect();
  // date-fns date string
  const currentDate = format(new Date(), "dd/MM/yyyy");
  // event action string from Gocardless webhook event
  switch (event.action) {
    case "created":
      //If case created create new subscription for the customer,
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
      if (event.links.customer) {
        console.log(event.action);
        console.log(event.links);
        // Once the subscription has been setup, 'fulfilled' will be sent from Gocardless and then we can
        // update the customer record in the DB
        await client.customers
          .find(event.links.customer)
          .then(async (customer: { email: string }) => {
            console.log("FROM GC", customer);
            await Members.findOneAndUpdate(
              { email: `${customer.email}` },
              {
                active_mandate: true,
                direct_debit_started: currentDate,
                mandate: event.links.mandate_request_mandate,
                go_cardless_id: event.links.customer,
              }
            );
          })
          .catch((err: any) => console.log("Created DB ERROR:", err));
      }
      break;
    //** handle canceled mandate **//
    case "cancelled":
      // check if mandate exists as the 'canceled' action is sent from gocardless with and without it'
      if (event.links.mandate) {
        const canceledCcustomer = await getCustomerFromGoCardless(event);
        await Members.findOneAndUpdate(
          { email: `${canceledCcustomer.email}` },
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
      //  console.log(event);
      return;
  }
};

// Handle the coming Webhook and check its signature, this is from  from Gocardless docs.
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
      console.log("invalid signature, look out!");
    }
  }
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // get raw body as string
  const body = (await buffer(req)).toString();
  // get signature from headers
  const signature = req.headers["webhook-signature"]?.toString();
  // check signature and if ok return array of events
  const checkSignature = parseEvents(body, signature);
  // if array pass to event handler function
  checkSignature &&
    checkSignature.map((event: MandateType) => {
      processEvents(event);
    });

  res.status(200).json("ok");
}
// turn off body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
