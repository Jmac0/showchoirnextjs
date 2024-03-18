import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

import MemberNav from "@/src/components/Navigation/MemberNav";
import { localMusicData } from "@/src/devData/localMusicData";
import {
  createDataStructure,
  createPresignedUrlAndTrackName,
  fetchS3Objects,
} from "@/src/lib/aws/fetchS3MusicData";

type MusicData = { song: string; urls: [{ trackName: string; url: string }] }[];

type Props = {
  trackList: MusicData;
};

export default function Resources({ trackList }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    // redirect to login if not authenticated
    if (!session) {
      router.replace("/auth/signin");
    }
  }, [router, session, status]);
  if (!session) {
    return <div className="h-screen w-full content-center justify-center" />;
  }
  console.log(trackList);
  return (
    <div className="m-0 flex w-full p-0">
      <MemberNav />
      <div className="mt-10 flex h-full w-full justify-center">
        <h1>Music & Lyrics</h1>
        <section>
          {trackList.map((el) => (
            <div key={el.song} className="">
              {el.song}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  // return only local music files in development
  if (process.env.NODE_ENV !== "production") {
    console.log(localMusicData);
    return {
      props: { trackList: localMusicData },
    };
  }
  // get s3 objects at build time
  const s3ObjectPaths = await fetchS3Objects("Harmonies/");
  const trackList = createDataStructure(s3ObjectPaths);
  // await all promises to resolve & call function to create objects for each s3 object
  const arrayOfNamesAndUrls = await Promise.all(
    s3ObjectPaths.map(async (path: string | undefined) => {
      if (!path) return null;
      const result = await createPresignedUrlAndTrackName(path);
      return result;
    })
  );

  if (!arrayOfNamesAndUrls.length) {
    throw new Error();
  }
  arrayOfNamesAndUrls.forEach((element) => {
    if (!element || !element.trackName || !element.url) return;

    // Trim whitespace and get the first word
    const song = element.trackName.split(" ")[0];
    const title = element.trackName;
    // find and match song urls to the correct object in tracklist
    if (song) {
      const match = trackList.find((track) => track.song.includes(song));
      if (match) {
        match.urls.push({ url: element.url, trackName: title });
      }
    }
  });

  return {
    props: { trackList },
  };
}
