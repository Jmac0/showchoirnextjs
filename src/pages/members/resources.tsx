import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import React, { useEffect, useState } from "react";

import { AudioAndLyricsContainer } from "@/src/components/members/AudioAndLyricsContainer";
import MemberNav from "@/src/components/Navigation/MemberNav";
import dbConnect from "@/src/lib/dbConnect";
import { isMembershipActive } from "@/src/lib/directDebit";
import Members from "@/src/lib/models/member";
import { songsForMembers } from "@/src/lib/music";
import { MemberSong, MemberTrack, VOICE_PARTS } from "@/src/lib/musicShared";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// The member's "My part" choice, remembered in this browser
const PART_KEY = "musicPart";
// "everything" = show every part's tracks
type PartFilter = "everything" | (typeof VOICE_PARTS)[number]["value"];

// The tracks to show for the chosen part: that part's audio, plus "All
// voices" audio, plus every lyrics / sheet music PDF
const tracksForPart = (tracks: MemberTrack[], part: PartFilter) =>
  part === "everything"
    ? tracks
    : tracks.filter(
        (track) =>
          track.kind !== "audio" || track.part === part || track.part === "all"
      );

// Members' Music & Lyrics: current songs, with archived ones tucked away
// below. Songs and their details come from MongoDB; the files from R2 via
// signed links made on the server for each visit (they work for an hour).
export default function Resources({ songs }: { songs: MemberSong[] }) {
  const [part, setPart] = useState<PartFilter>("everything");
  const [showArchived, setShowArchived] = useState(false);

  // Remembered part - read after the page loads (not available on the server)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PART_KEY) as PartFilter | null;
      if (saved) setPart(saved);
    } catch {
      // Storage blocked (e.g. private browsing) - just use "everything"
    }
  }, []);

  const choosePart = (chosen: PartFilter) => {
    setPart(chosen);
    try {
      window.localStorage.setItem(PART_KEY, chosen);
    } catch {
      // not remembered, that's fine
    }
  };

  const current = songs.filter((song) => song.status === "current");
  const archived = songs.filter((song) => song.status === "archived");

  return (
    <div className="m-0 flex w-full p-0">
      <Head>
        <title>Music & Lyrics</title>
      </Head>
      <MemberNav />
      <div className="mt-10 flex h-full w-full flex-col items-center justify-center pb-16">
        <h1>Music & Lyrics</h1>

        {/* --- My part --- */}
        <label className="mt-2 flex items-center gap-3 text-gray-300">
          My part
          <select
            value={part}
            onChange={(e) => choosePart(e.target.value as PartFilter)}
            className="rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none"
          >
            <option value="everything">Show every part</option>
            {VOICE_PARTS.filter((p) => p.value !== "all").map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {/* --- Current songs --- */}
        {current.length === 0 && (
          <p className="mt-6 text-gray-300">No songs yet - check back soon!</p>
        )}
        {current.map((song) => (
          <AudioAndLyricsContainer
            key={song.id}
            title={song.title}
            tracks={tracksForPart(song.tracks, part)}
          />
        ))}

        {/* --- Archived songs, tucked away --- */}
        {archived.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              aria-expanded={showArchived}
              className="mt-10 rounded-full border border-lightGold/60 px-5 py-2 text-lightGold hover:bg-lightGold hover:text-black"
            >
              {showArchived ? "Hide" : "Show"} archived songs ({archived.length}
              )
            </button>
            {showArchived &&
              archived.map((song) => (
                <AudioAndLyricsContainer
                  key={song.id}
                  title={song.title}
                  tracks={tracksForPart(song.tracks, part)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

// Members only - checked on the server, so the songs (and their links) are
// never sent to anyone who isn't logged in, or whose membership isn't active
// (they're sent to their Account page, which says how to set up a Direct
// Debit). Links are made fresh per visit.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  }
  await dbConnect();
  const member = await Members.findOne({ email: session.user?.email });
  if (!member || !isMembershipActive(member)) {
    return {
      redirect: {
        destination: "/members/dashboard?component=account",
        permanent: false,
      },
    };
  }
  return {
    props: {
      songs: await songsForMembers({ requestHost: context.req.headers.host }),
    },
  };
}
