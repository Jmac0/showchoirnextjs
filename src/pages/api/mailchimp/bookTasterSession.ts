import type { NextApiRequest, NextApiResponse } from "next";

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
  if (req.method !== "POST") {
    return res.status(401).json({ message: "Method is not supported" });
  }
  const regex = /.*.ru$/;
  // check first and last names are not the same as an anti-spam filter
  if (req.body.firstName === req.body.lastName) {
    return res
      .status(401)
      .json({ message: "First name must be different from last name" });
  }
  // check email does not end in .ru
  if (regex.test(req.body.email)) {
    return res.status(400).json({ message: "Please enter a valid email" });
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
        message = "It looks like you have already booked taster. 😀";
      } else {
        message = detail;
      }
      return res.status(400).json({ message });
    });
}
