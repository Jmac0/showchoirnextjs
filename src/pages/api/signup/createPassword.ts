import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-extraneous-dependencies
const bcrypt = require("bcrypt");

/* Api end point to hash user password and save to DB */
export default async function CreatePassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // only accept POST requests
  if (req.method !== "POST")
    return res.status(401).json({ message: "Method not supported" });
  await dbConnect();
  const { email, password } = req.body;
  try {
    const currentMemberDocument = await Members.findOne({ email });
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

    // hash incoming password
    const hash = bcrypt.hashSync(password, 8);
    // find and update the custom record with hashed password
    await Members.findOneAndUpdate(
      { email },
      { password: hash },
      { new: true }
    );
    // return error message if user not found
    res
      .status(200)
      .json({ message: "Password created successfully", status: 200 });
  } catch (err: unknown) {
    return res.status(500).json({ message: err });
  }
}
