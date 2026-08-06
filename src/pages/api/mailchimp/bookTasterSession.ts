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

// find the interest (Mailchimp calls list "groups" interests) whose
// name matches the location the user picked, searching across all
// interest categories on the list
async function findLocationInterestId(
  location: string,
): Promise<string | undefined> {
  const { categories } = await mailchimp.lists.getListInterestCategories(
    listId,
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const category of categories) {
    // eslint-disable-next-line no-await-in-loop
    const { interests } = await mailchimp.lists.listInterestCategoryInterests(
      listId,
      category.id,
    );
    const match = interests.find(
      (interest: { id: string; name: string }) =>
        interest.name.toLowerCase() === location.toLowerCase(),
    );
    if (match) return match.id;
  }
  return undefined;
}

// eslint-disable-next-line consistent-return
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { email, firstName, lastName, location, company } = req.body;
  // honeypot field - real users never see or fill this in, so treat any
  // submission with it populated as a bot and silently pretend to succeed
  if (company) {
    res.status(200).json({
      message: "Your session is booked 👍",
    });
    return;
  }
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

  const locationInterestId = await findLocationInterestId(location);

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
      }),
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
