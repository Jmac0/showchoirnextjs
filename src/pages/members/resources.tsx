import axios from "axios";
import { da } from "date-fns/locale";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

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
  console.log(trackList);
  const { data: session, status } = useSession();

  const router = useRouter();
  useEffect(() => {
    // redirect to login if not authenticated
    if (status === "unauthenticated" && !session) {
      router.replace("/auth/signin");
    }
  }, [router, session, status]);
  if (!session) {
    return <div className="h-screen w-full content-center justify-center" />;
  }
  return <div>resourceses</div>;
}
export async function getStaticProps() {
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
