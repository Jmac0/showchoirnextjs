import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

import { ContactEmailTemplate } from "@/src/components/emails/ContactEmailTemplate";
import { rejectSpam } from "@/src/lib/helpers/formSpamCheck";
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
} from "@/src/lib/helpers/formSpamShared";
import { validateFormData } from "@/src/lib/helpers/validateFormData";

const SUCCESS_MESSAGE = "Your message has been sent";

export default async function HandleContactSubmission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email, firstName, lastName, message } = req.body;

  // validate incoming form data
  const validationResponse = validateFormData({
    method: req.method,
    firstName,
    lastName,
    email,
    res,
  });
  if (validationResponse !== null) {
    return; // validationResponse already handled the response
  }

  // hidden field, fill-in time, links and sends per address
  if (
    rejectSpam({
      req,
      res,
      form: "contact",
      texts: [firstName, lastName, message],
      successMessage: SUCCESS_MESSAGE,
    })
  ) {
    return;
  }

  // the form already insists on these, but a request sent straight to the
  // API skips the form
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    firstName.length > MAX_NAME_LENGTH ||
    lastName.length > MAX_NAME_LENGTH
  ) {
    res.status(400).json({ message: "Please check your name" });
    return;
  }
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ message: "Please enter a message" });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({
      message: `Please keep your message under ${MAX_MESSAGE_LENGTH} characters`,
    });
    return;
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
      res.status(200).json({ message: SUCCESS_MESSAGE });
    })
    .catch(async (err) => {
      res.status(err.statusCode).json({ message: "Sorry there was an error" });
      // eslint-disable-next-line no-console
      console.error(err);
    });
}
