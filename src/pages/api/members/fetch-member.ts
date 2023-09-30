import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";

/* Api end point to fetch logged in user data from DB */
// eslint-disable-next-line consistent-return
export default async function fetchMember(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // only accept POST requests
  if (req.method !== "POST")
    return res.status(401).json({ message: "Method not supported" });
  await dbConnect();
  const { email } = req.body;
  try {
    // TODO select only required fields
    const member = await Members.findOne({ email });
    if (!member)
      return res.status(404).json({
        message: "We cant find an account with this email",
      });

    res.status(200).json({ member });
  } catch (err: unknown) {
    return res.status(500).json({ message: err });
  }
}
