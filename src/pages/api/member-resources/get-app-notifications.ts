import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { applyCors } from "@/src/lib/cors";

type Notification = {
  id: number;
  message: string;
  date: string;
};

const notifications: Notification[] = [
  { id: 1, message: "Welcome to the app!", date: "2023-10-01" },
  { id: 2, message: "Your profile is complete.", date: "2023-10-02" },
];

// The app's notifications - active members only
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  // Logged in, with an active membership (sends 401/403 itself if not)
  if (!(await requireActiveMember(req, res))) return undefined;

  if (req.method === "GET") {
    return res.status(200).json(notifications);
  }
  return res.status(405).json({ message: "Method Not Allowed" });
}
