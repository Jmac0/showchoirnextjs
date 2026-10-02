import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Songs, { TrackType } from "@/src/lib/models/song";
import { deleteFiles, toAdminSong } from "@/src/lib/music";
import { VOICE_PARTS, VoicePart } from "@/src/lib/musicShared";

// Music & Lyrics admin - one file of a song (admins only).
//   PATCH { label?, part? }   rename it, or change its voice part (audio)
//   DELETE                    remove it from the song and delete it from R2
export default async function track(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  const { id: songId, trackId } = req.query;
  if (!isValidObjectId(songId) || !isValidObjectId(trackId)) {
    return res.status(404).json({ message: "File not found" });
  }

  if (req.method === "PATCH") {
    const { label, part } = req.body as { label?: string; part?: VoicePart };
    const changes: Record<string, string> = {};
    if (label !== undefined) {
      if (!String(label).trim()) {
        return res.status(400).json({ message: "Please give the file a name" });
      }
      changes["tracks.$.label"] = String(label).trim();
    }
    if (part !== undefined) {
      if (!VOICE_PARTS.some((p) => p.value === part)) {
        return res.status(400).json({ message: "Unknown voice part" });
      }
      changes["tracks.$.part"] = part;
    }

    const updated = await Songs.findOneAndUpdate(
      { _id: songId, "tracks._id": trackId },
      { $set: changes },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: "File not found" });
    return res.status(200).json({ song: toAdminSong(updated) });
  }

  if (req.method === "DELETE") {
    // Remove it from the song first, then its file, so members never see a
    // track whose file has gone
    const before = await Songs.findOneAndUpdate(
      { _id: songId, "tracks._id": trackId },
      { $pull: { tracks: { _id: trackId } } }
    ).lean();
    if (!before) return res.status(404).json({ message: "File not found" });

    const removed = (before.tracks as TrackType[]).find(
      (t) => String(t._id) === String(trackId)
    );
    if (removed) await deleteFiles([removed.key]);

    const updated = await Songs.findById(songId).lean();
    return res
      .status(200)
      .json({ song: updated ? toAdminSong(updated) : null });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
