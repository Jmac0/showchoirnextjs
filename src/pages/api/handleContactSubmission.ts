import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

import { ContactEmailTemplate } from "@/src/components/emails/ContactEmailTemplate";
import { validateFormData } from "@/src/lib/helpers/validateFormData";

export default async function HandleContactSubmission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email, firstName, lastName, message } = req.body;

  // validate incoming form data
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

  // send user submitted form data to admin email
  await resend
    .sendEmail({
      from: process.env.FROM_EMAIL as string,
      to: process.env.ADMIN_EMAIL as string,
      subject: "New Message from Show Choir",
      react: ContactEmailTemplate({
        firstName,
        lastName,
        email,
        message,
      }),
    })
    // If all ok returns an object with an id string
    .then(() => {
      res.status(200).json({ message: "Your message has been sent" });
    })
    .catch(async (err) => {
      res.status(err.statusCode).json({ message: "Sorry there was an error" });
      // eslint-disable-next-line no-console
      console.error(err);
    });
}
