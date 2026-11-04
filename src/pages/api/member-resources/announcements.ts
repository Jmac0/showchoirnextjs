import { NextApiRequest, NextApiResponse } from "next";

import { listAnnouncements } from "@/src/lib/announcements";
import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { applyCors } from "@/src/lib/cors";

// The app's Announcements tab - active members only. Pinned first, then
// newest. (Admins post them via api/admin/announcements.)
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
    return res.status(200).json({ announcements: await listAnnouncements() });
  }
  res.setHeader("Allow", "GET");
  return res.status(405).json({ message: "Method Not Allowed" });
}
