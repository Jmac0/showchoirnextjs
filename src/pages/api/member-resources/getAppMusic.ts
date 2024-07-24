import { NextApiRequest, NextApiResponse } from "next";

import { verifyJWT } from "../../auth/verifyJWT";

type HeadersType = {
  headers: {
    authorization: string;
  };
};

const getAppMusic = (req: NextApiRequest, res: NextApiResponse) => {
  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);

  if (!isLoggedIn) return res.status(401).json({ message: "Not authorized" });
  return res.status(200).json({ isLoggedIn });
};

export default getAppMusic;
