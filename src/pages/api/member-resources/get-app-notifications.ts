import { NextApiRequest, NextApiResponse } from "next";

import { HeadersType } from "@/src/types/types";

import { verifyJWT } from "@/src/lib/auth/verifyJWT";

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
  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);
  if (req.method === "GET") {
    res.status(200).json(notifications);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
