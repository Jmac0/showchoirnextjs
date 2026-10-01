import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import { decryptEmail } from "@/src/lib/encryptEmail";
import Members from "@/src/lib/models/member";

// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-extraneous-dependencies
const bcrypt = require("bcrypt");

// Same rule as CreateAccountForm
const MIN_PASSWORD_LENGTH = 4;

/* Sets a new member's password, from the Create Account page.

The member is identified by the encrypted email ("token") from the link in
their welcome email - not by a plain email address - so only someone who has
the emailed link can set the password. It only works once: a member who
already has a password is turned away.
POST { token, password } */
export default async function CreatePassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // only accept POST requests
  if (req.method !== "POST")
    return res.status(401).json({ message: "Method not supported" });

  const { token, password } = req.body as { token?: string; password?: string };

  // A missing or tampered-with link decrypts to an empty string
  const email = typeof token === "string" ? decryptEmail(token) : "";
  if (!email) {
    return res.status(400).json({
      message: "This link isn't valid - please use the link in your email",
    });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });
  }

  try {
    await dbConnect();
    const currentMemberDocument = await Members.findOne({ email }).select(
      "+password"
    );
    if (!currentMemberDocument)
      return res.status(404).json({
        message: "We cant find an account with this email",
      });
    // check to see if the password already exists
    if (currentMemberDocument.password) {
      return res
        .status(401)
        .json({ message: "This account already has a password" });
    }

    // hash incoming password and save it
    const hash = bcrypt.hashSync(password, 8);
    await Members.updateOne(
      { _id: currentMemberDocument.id },
      { password: hash }
    );

    res
      .status(200)
      .json({ message: "Password created successfully", status: 200 });
  } catch (err: unknown) {
    return res.status(500).json({ message: err });
  }
}
