import { NextApiRequest, NextApiResponse } from "next";

import { verifyJWT } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import { HeadersType } from "@/src/types/types";

const getAppMusic = (req: NextApiRequest, res: NextApiResponse) => {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  // TODO - Implement the logic to get the app music form AWS or the database
  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);

  if (!isLoggedIn) return res.status(401).json({ message: "Not authorized" });
  return res.status(200).json({ isLoggedIn });
};

export default getAppMusic;
