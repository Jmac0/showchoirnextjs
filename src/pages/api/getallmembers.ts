import type { NextApiRequest, NextApiResponse } from "next";

import dbConnect from "@/src/lib/dbConnect";
/* eslint-disable  @typescript-eslint/no-var-requires */
const Members = require("@/src/lib/models/member");

const hander = async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect();

  const members = await Members.find({});

  res.status(200).json(members);
};

export default hander;
