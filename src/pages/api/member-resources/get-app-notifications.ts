import { NextApiRequest, NextApiResponse } from "next";

import { verifyJWT } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import { HeadersType } from "@/src/types/types";

type Notification = {
  id: number;
  message: string;
  date: string;
};

const notifications: Notification[] = [
  { id: 1, message: "Welcome to the app!", date: "2023-10-01" },
  { id: 2, message: "Your profile is complete.", date: "2023-10-02" },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);
  if (!isLoggedIn) return res.status(401).json({ message: "Not authorized" });

  if (req.method === "GET") {
    return res.status(200).json(notifications);
  }
  return res.status(405).json({ message: "Method Not Allowed" });
}
