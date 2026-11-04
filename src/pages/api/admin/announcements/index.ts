import { NextApiRequest, NextApiResponse } from "next";

import {
  checkAnnouncement,
  createAnnouncement,
  listAnnouncements,
} from "@/src/lib/announcements";
import { requireAdminAnyLogin } from "@/src/lib/auth/requireAdminAnyLogin";
import { applyCors } from "@/src/lib/cors";

// Announcements admin (admins only - from the website or the app).
//   GET                               every announcement, pinned first
//   POST { title, message, pinned }   post a new one
export default async function announcements(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // The app's web version calls this from another address
  if (applyCors(req, res)) return undefined;

  const admin = await requireAdminAnyLogin(req, res);
  if (!admin) return undefined;

  if (req.method === "GET") {
    return res.status(200).json({ announcements: await listAnnouncements() });
  }

  if (req.method === "POST") {
    const checked = checkAnnouncement(req.body || {});
    if ("error" in checked) {
      return res.status(400).json({ message: checked.error });
    }
    await createAnnouncement(
      { ...checked, pinned: req.body.pinned === true },
      admin
    );
    return res.status(201).json({ announcements: await listAnnouncements() });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method Not Allowed" });
}
