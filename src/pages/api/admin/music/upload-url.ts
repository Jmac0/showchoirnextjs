import mongoose, { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Songs from "@/src/lib/models/song";
import { trackKey, uploadUrlFor } from "@/src/lib/music";
import { TrackKind, uploadProblem } from "@/src/lib/musicShared";

/* Music & Lyrics admin - step 1 of adding a file (admins only).

The admin's browser uploads files straight to R2, not through this server
(big audio files would hit the website host's size limits). So this checks
the file is allowed and returns a short-lived upload link for it:
  POST { songId, fileName, contentType, size, kind }
  -> { uploadUrl, key, trackId }
The browser then PUTs the file to uploadUrl, and confirms with
POST api/admin/music/songs/<songId>/tracks (step 2). */
export default async function uploadUrl(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const { songId, fileName, contentType, size, kind } = req.body as {
    songId?: string;
    fileName?: string;
    contentType?: string;
    size?: number;
    kind?: TrackKind;
  };

  if (!isValidObjectId(songId) || !(await Songs.exists({ _id: songId }))) {
    return res.status(404).json({ message: "Song not found" });
  }
  if (!fileName) {
    return res.status(400).json({ message: "Please choose a file" });
  }
  const problem = uploadProblem(
    kind as TrackKind,
    String(contentType || ""),
    Number(size)
  );
  if (problem) return res.status(400).json({ message: problem });

  // The new track's id is decided now, so it can be part of the file's key
  const trackId = new mongoose.Types.ObjectId().toString();
  const key = trackKey(String(songId), trackId, fileName);

  return res.status(200).json({
    uploadUrl: await uploadUrlFor(key, String(contentType), Number(size)),
    key,
    trackId,
  });
}
