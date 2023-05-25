import axios from "axios";
import { response } from "msw";
import type { NextApiRequest, NextApiResponse } from "next";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mailchimp = require("@mailchimp/mailchimp_marketing");

const listId = process.env.MAILCHIMP_LIST_ID;
const abstractKey = process.env.ABSTRACT_API_KEY;
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(401).json("method is not supported");
  }
  const regex = /.*.ru$/;
  // check first and last names are not the same as an anti-spam filter
  if (req.body.firstName === req.body.lastName) {
    res
      .status(401)
      .json({ message: "First name must be different from last name" });
    return;
  }
  // check email does not end in .ru
  if (regex.test(req.body.email)) {
    res.status(400).json({ message: "Please enter a valid email" });
    return;
  }

  try {
    // Get validation info for email from Abstract API
    const response = await axios.get(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${abstractKey}&email=${req.body.email}`
    );
    // check email validation score is OK
    if (Number(response.data.quality_score) < 0.5) {
      res.status(400).json({ userMessage: "Email trust score too low" });
      return;
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }

  //  if all OK, add to a prospects' list
  await mailchimp.lists
    .addListMember(listId, {
      email_address: req.body.email,
      status: "subscribed",
      merge_fields: {
        FNAME: req.body.firstName,
        LNAME: req.body.lastName,
      },
    })
    .then((response: { status: number }) => {
      // If email added OK, send the subscribed message back
      res.status(200).json({
        status: response.status,
        message: "Your session is booked 👍",
      });
    })
    .catch((err: any) => {
      // catch errors thrown by Mailchimp
      // Destructure error object
      console.log(err);
      const errorObject = JSON.parse(err.response.text);
      let message;
      // change the error message to friendly one
      if (errorObject.title === "Member Exists") {
        message = "It looks like you have already booked a taster. 😀";
      } else {
        message = errorObject.title;
      }

      res.status(400).json({ status: err.response.status, message });
    });
}
