import { NextApiRequest, NextApiResponse } from "next";

import {
  checkAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "@/src/lib/announcements";
import { requireAdminAnyLogin } from "@/src/lib/auth/requireAdminAnyLogin";
import { applyCors } from "@/src/lib/cors";

// Announcements admin - one announcement (admins only - website or app).
//   PATCH { title, message }   edit the words
//   PATCH { pinned }           pin to the top / unpin
//   DELETE                     remove it
// Both reply with the whole list, so the page can just show it.
export default async function announcement(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // The app's web version calls this from another address
  if (applyCors(req, res)) return undefined;

  const admin = await requireAdminAnyLogin(req, res);
  if (!admin) return undefined;

  const { id } = req.query;
  const notFound = () =>
    res.status(404).json({ message: "Announcement not found" });

  if (req.method === "PATCH") {
    const body = req.body || {};
    const changes: { title?: string; message?: string; pinned?: boolean } = {};
    if ("title" in body || "message" in body) {
      const checked = checkAnnouncement(body);
      if ("error" in checked) {
        return res.status(400).json({ message: checked.error });
      }
      Object.assign(changes, checked);
    }
    if (typeof body.pinned === "boolean") changes.pinned = body.pinned;
    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ message: "Nothing to change" });
    }

    if (!(await updateAnnouncement(id, changes))) return notFound();
    return res.status(200).json({ announcements: await listAnnouncements() });
  }

  if (req.method === "DELETE") {
    if (!(await deleteAnnouncement(id))) return notFound();
    return res.status(200).json({ announcements: await listAnnouncements() });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
