import { NextApiRequest, NextApiResponse } from "next";

import { verifyJWT } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import { songsForMembers } from "@/src/lib/music";
import { HeadersType } from "@/src/types/types";

// Music & Lyrics for the app's Resources tab (members logged in to the app).
// Same songs as the website's members page: from MongoDB, with signed links
// to the files in R2 that work for an hour - the app fetches fresh ones each
// time the tab opens. GET -> { songs: MemberSong[] }
const getAppMusic = async (req: NextApiRequest, res: NextApiResponse) => {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const isLoggedIn = verifyJWT(req.headers as HeadersType["headers"]);
  if (!isLoggedIn) return res.status(401).json({ message: "Not authorized" });

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
