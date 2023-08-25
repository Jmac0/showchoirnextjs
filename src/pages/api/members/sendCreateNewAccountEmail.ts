import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

import { EmailTemplate } from "@/src/components/emails/EmailTemplate";
import dbConnect from "@/src/lib/dbConnect";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import Members from "@/src/lib/models/member";
/* Api endpoint that receives a request from Mongo
when a user document is updated to have active_mandate set to true.
Then sends an email to the user with a link to the create account page */
export default async function sendCreateNewAccountEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email } = req.body.fullDocument;
  // Query the database here, and if the document is found,
  // then we know it's a real user
  const validMember: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  } | null = await Members.findOne({
    email,
  });
  if (validMember) {
    // send the email to the client with a link to the create account page
    await resend
      .sendEmail({
        from: `${process.env.FROM_EMAIL}`,
        to: `${validMember.email}`,
        subject: "Welcome to Show Choir",
        react: EmailTemplate({
          name: validMember.first_name,
          email: validMember.email,
        }),
      })
      .then((response) => {
        res.status(200).json(response);
      })
      .catch(async (err) => {
        // if there is an error sending the email to the client, notify admin
        res.status(err.statusCode).json(err);
        await resend
          .sendEmail({
            from: `${process.env.FROM_EMAIL}`,
            to: `${process.env.ADMIN_EMAIL}`,
            subject: "Email Problem",
            html: `There is a problem with the customer  
          email setup: ${validMember.email}, 
          name: ${validMember.first_name} 
          ${validMember.last_name}, 
         Phone: ${validMember.phone_number}`,
          })
          .then(() => {
            res.status(200);
          })
          .catch((err) => {
            res.status(400);
            throw new Error(err.message);
          });
      });
  } else {
    res.status(404).json({ message: "User not found" });
  }
}
