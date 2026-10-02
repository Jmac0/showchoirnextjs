import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Songs, { TrackType } from "@/src/lib/models/song";
import { deleteFiles, toAdminSong } from "@/src/lib/music";

// Music & Lyrics admin - one song (admins only).
//   PATCH { title?, status? }   rename, or move between current/archived
//   DELETE                      delete the song and all its files in R2
export default async function song(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Song not found" });
  }

  if (req.method === "PATCH") {
    const { title, status } = req.body as { title?: string; status?: string };
    const changes: { title?: string; status?: string } = {};
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res
          .status(400)
          .json({ message: "Please give the song a title" });
      }
      changes.title = String(title).trim();
    }
    if (status !== undefined) {
      if (!["current", "archived"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status must be current or archived" });
      }
      changes.status = status;
    }

    const updated = await Songs.findByIdAndUpdate(id, changes, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ message: "Song not found" });
    return res.status(200).json({ song: toAdminSong(updated) });
  }

  if (req.method === "DELETE") {
    const deleted = await Songs.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Song not found" });
    // Then its files - after the song is gone, so members never see a song
    // whose files have disappeared
    await deleteFiles(
      (deleted.tracks as TrackType[]).map((track) => track.key)
    );
    return res.status(200).json({ message: "Song deleted" });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
