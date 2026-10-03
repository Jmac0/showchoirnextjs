import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { applyCors } from "@/src/lib/cors";
import { songsForMembers } from "@/src/lib/music";

// Music & Lyrics for the app's Resources tab (members logged in to the app).
// Same songs as the website's members page: from MongoDB, with signed links
// to the files in R2 that work for an hour - the app fetches fresh ones each
// time the tab opens. Active members only. GET -> { songs: MemberSong[] }
const getAppMusic = async (req: NextApiRequest, res: NextApiResponse) => {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Logged in, with an active membership (sends 401/403 itself if not)
  if (!(await requireActiveMember(req, res))) return res;

  try {
    return res.status(200).json({
      songs: await songsForMembers({ requestHost: req.headers.host }),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Couldn't load music:", (error as Error).message);
    return res.status(500).json({ message: "Couldn't load the music" });
  }
};

export default getAppMusic;
