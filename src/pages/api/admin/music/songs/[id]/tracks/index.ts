import mongoose, { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Songs from "@/src/lib/models/song";
import { toAdminSong, trackKey, uploadedSize } from "@/src/lib/music";
import {
  TrackKind,
  uploadProblem,
  VOICE_PARTS,
  VoicePart,
} from "@/src/lib/musicShared";

/* Music & Lyrics admin - step 2 of adding a file (admins only): after the
browser has uploaded the file to R2 (see api/admin/music/upload-url.ts),
check it really arrived and add it to the song.
  POST { trackId, fileName, contentType, size, kind, part?, label } */
export default async function addTrack(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  const { id: songId } = req.query;
  const { trackId, fileName, contentType, size, kind, part, label } =
    req.body as {
      trackId?: string;
      fileName?: string;
      contentType?: string;
      size?: number;
      kind?: TrackKind;
      part?: VoicePart;
      label?: string;
    };

  // --- Check what we've been sent ---

  if (!isValidObjectId(songId) || !isValidObjectId(trackId) || !fileName) {
    return res.status(400).json({ message: "Missing file details" });
  }
  const problem = uploadProblem(
    kind as TrackKind,
    String(contentType || ""),
    Number(size)
  );
  if (problem) return res.status(400).json({ message: problem });
  if (kind === "audio" && !VOICE_PARTS.some((p) => p.value === part)) {
    return res.status(400).json({ message: "Please choose the voice part" });
  }
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) {
    return res.status(400).json({ message: "Please give the file a name" });
  }

  // The key is worked out again here (not taken from the browser), so an
  // admin can only attach files uploaded for this song and track
  const key = trackKey(String(songId), String(trackId), fileName);

  // --- Check the file really arrived in R2 ---

  const storedSize = await uploadedSize(key);
  if (storedSize === null) {
    return res
      .status(400)
      .json({ message: "The upload didn't finish - please try again" });
  }

  // --- Add it to the song ---

  const updated = await Songs.findOneAndUpdate(
    // Not if it's already been added (e.g. confirm sent twice)
    { _id: songId, "tracks._id": { $ne: trackId } },
    {
      $push: {
        tracks: {
          _id: new mongoose.Types.ObjectId(String(trackId)),
          kind,
          ...(kind === "audio" ? { part } : {}),
          label: cleanLabel,
          key,
          file_name: fileName,
          content_type: contentType,
          size: storedSize,
          uploaded_at: new Date(),
          uploaded_by: admin.id,
        },
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const song = await Songs.findById(songId).lean();
    if (!song) return res.status(404).json({ message: "Song not found" });
    // Already added - just return the song as it is
    return res.status(200).json({ song: toAdminSong(song) });
  }
  return res.status(201).json({ song: toAdminSong(updated) });
}
