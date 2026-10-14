import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { rejectSpam } from "@/src/lib/helpers/formSpamCheck";
import { MAX_NAME_LENGTH } from "@/src/lib/helpers/formSpamShared";
import { validateFormData } from "@/src/lib/helpers/validateFormData";
import { choirInterestId } from "@/src/lib/mailchimp";
import { saveTasterBooking } from "@/src/lib/tasters";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mailchimp = require("@mailchimp/mailchimp_marketing");

const listId = process.env.MAILCHIMP_LIST_ID;
// const abstractKey = process.env.ABSTRACT_API_KEY;
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

// eslint-disable-next-line consistent-return
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, firstName, lastName, location } = req.body;
  // validate form data
  const validationResponse = validateFormData({
    method: req.method,
    firstName,
    lastName,
    email,
    location,
    res,
  });
  if (validationResponse !== null) {
    return; // validationResponse already handled the response
  }

  // hidden "company" field (honeypot), fill-in time, links and sends per
  // address - bots get the normal "booked" reply so they learn nothing
  if (
    rejectSpam({
      req,
      res,
      form: "taster",
      texts: [firstName, lastName],
      successMessage: "Your session is booked 👍",
    })
  ) {
    return;
  }

  // a request sent straight to the API skips the form's own checks
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    firstName.length > MAX_NAME_LENGTH ||
    lastName.length > MAX_NAME_LENGTH
  ) {
    res.status(400).json({ message: "Please check your details" });
    return;
  }

  // Save the booking, so GAs see it on the choir's "Taster bookings" list in
  // the app (lib/tasters.ts). Never stops the booking - Mailchimp sends the
  // email as before.
  try {
    await dbConnect();
    await saveTasterBooking({ firstName, lastName, email, location });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Saving taster booking failed:", (error as Error).message);
  }

  // The Prospects audience's group for the choir they picked
  const locationInterestId = await choirInterestId(
    listId as string,
    location
  ).catch(() => undefined);

  //  If all OK, add to a prospects' list
  await mailchimp.lists
    .addListMember(listId, {
      email_address: req.body.email,
      status: "subscribed",
      merge_fields: {
        FNAME: req.body.firstName,
        LNAME: req.body.lastName,
      },
      ...(locationInterestId && {
        interests: { [locationInterestId]: true },
      }),
    })
    .then(() =>
      // If email added OK, send the subscribed message
      // back
      res.status(200).json({
        message: "Your session is booked 👍",
      })
    )
    .catch(
      (err: { response?: { body?: { title?: string; detail?: string } } }) => {
        // Handle errors returned by Mailchimp - err.response may be
        // missing entirely (e.g. network error, bad Mailchimp config)
        // rather than a normal HTTP error response, so guard against that
        console.log(err.response);
        const { title, detail } = err.response?.body ?? {};
        // change the error message to friendly one
        let message;
        if (title === "Member Exists") {
          message = "It looks like you have already booked taster.";
        } else {
          message = detail || "There seems to be a technical problem!";
        }
        return res.status(400).json({ message });
      }
    );
}
