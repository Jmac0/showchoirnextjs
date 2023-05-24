import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Members = require("@/src/lib/models/member");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const data = await Members.find({});

  res.json(data);
}
