import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import Songs from "@/src/lib/models/song";
import { toAdminSong } from "@/src/lib/music";

// Music & Lyrics admin - all songs (admins only).
//   GET              every song with its files' details (no links)
//   POST { title }   add a song (starts as "current", with no files)
export default async function songs(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  if (req.method === "GET") {
    const all = await Songs.find()
      .collation({ locale: "en", strength: 2 })
      .sort({ title: 1 })
      .lean();
    return res.status(200).json({ songs: all.map(toAdminSong) });
  }

  if (req.method === "POST") {
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Please give the song a title" });
    }
    const song = await Songs.create({ title, created_by: admin.id });
    return res.status(201).json({ song: toAdminSong(song.toObject()) });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method Not Allowed" });
}
