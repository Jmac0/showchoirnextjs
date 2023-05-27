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
  const currentDate = format(new Date(), 'dd/MM/yyyy');
  // get details of customer from go cardless
  switch (event.action) {
    //** handle canceled mandate **//
    case 'cancelled':
  const customer: MemberType = await getCustomerFromGoCardless(event);
      await Members.findOneAndUpdate(
        { email: `${customer.email}` },
        { active: false },
      )
        .then((res: MemberType) => {
          console.log(res);
        })
        .catch((err: any) => {
          console.log(err);
        });
      break;
    /*Handle new customer sign up  */
		// was created but did not get mandate 
    case 'fulfilled':
      // Once the subscription has been setup, 'fulfilled' will be sent from Gocardless and then we can
      // update the customer record in the DB
      const newCustomer = await client.customers.find(event.links.customer);
	console.log(`CREATED: ${newCustomer}`)
	console.log(event)
      await Members.findOneAndUpdate(
        { email: `${newCustomer.email}` },
        {
          active_mandate: true,
          direct_debit_started: currentDate,
          mandate: event.links.mandate_request_mandate,
          go_cardless_id: event.links.customer,
        },
      )
        .catch((err: any) => console.log('Created DB ERROR:', err));

      break;
    default:
      return console.log(event);
  }
};

// Handle the coming Webhook and check its signature.
const parseEvents = (
  eventsRequestBody: any,
  signatureHeader: any, // From webhook header
) => {
  try {
    return webhooks.parse(
      eventsRequestBody,
      webhookEndpointSecret,
      signatureHeader,
    );
  } catch (error) {
    if (error instanceof webhooks.InvalidSignatureError) {
      console.log('invalid signature, look out!');
    }
  }
}; 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // get raw body as string
  const body = (await buffer(req)).toString();
  // get signature from headers
  const signature = req.headers['webhook-signature']?.toString();
  // check signature and if ok return array of events
  const checkSignature = parseEvents(body, signature);
  // if array pass to event handler function
  checkSignature &&
    checkSignature.map((event: MandateType) => {
      processEvents(event);
    });

  res.status(200).json('ok');
}
// turn off body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
