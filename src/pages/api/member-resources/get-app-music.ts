import { NextApiRequest, NextApiResponse } from "next";

import { HeadersType } from "@/src/types/types";

import { verifyJWT } from "@/src/lib/auth/verifyJWT";

const getAppMusic = (req: NextApiRequest, res: NextApiResponse) => {
  // TODO - Implement the logic to get the app music form AWS or the database
  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);

  if (!isLoggedIn) return res.status(401).json({ message: "Not authorized" });
  return res.status(200).json({ isLoggedIn });
};

export default getAppMusic;
