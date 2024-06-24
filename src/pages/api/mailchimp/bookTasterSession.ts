import type { NextApiRequest, NextApiResponse } from "next";

import { validateFormData } from "@/src/lib/helpers/validateFormData";

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
  const { email, firstName, lastName } = req.body;
  // validate form data
  const validationResponse = validateFormData(
    req.method,
    firstName,
    lastName,
    email,
    res
  );
  if (validationResponse !== null) {
    return; // validationResponse already handled the response
  }

  //  If all OK, add to a prospects' list
  await mailchimp.lists
    .addListMember(listId, {
      email_address: req.body.email,
      status: "subscribed",
      merge_fields: {
        FNAME: req.body.firstName,
        LNAME: req.body.lastName,
      },
    })
    .then(() =>
      // If email added OK, send the subscribed message
      // back
      res.status(200).json({
        message: "Your session is booked 👍",
      })
    )
    .catch((err: { response: { body: { title: string; detail: string } } }) => {
      // Handle errors returned by Mailchimp
      let message;
      const { title, detail } = err.response.body;
      // change the error message to friendly one
      if (title === "Member Exists") {
        message = "It looks like you have already booked taster.";
      } else {
        message = detail;
      }
      return res.status(400).json({ message });
    });
}
