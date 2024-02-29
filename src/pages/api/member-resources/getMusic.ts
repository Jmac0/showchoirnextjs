import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { el } from "date-fns/locale";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { fetchS3Objects, s3 } from "@/src/lib/aws/fetchS3Objects";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

const bucketName = process.env.S3_BUCKET_NAME as string;
// returns an array of objects containing a presigned url & the name/path of each harmony file
export default async function getMusic(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ failure: "unauthenticated" });
    // array of paths to all objects in /Harmonies in S3 bucket
  }

  /*
   harmonyObjects =  [
      {song: Memory, tracks: []}
   ]
  */
  const trackList: any = [];

  try {
    // array of objects, containing the path and a signed url
    const harmonyObjectArray: { url: string; trackName: string }[] = [];
    // Fetch paths for objects in the S3 bucket
    const s3ObjectPaths = await fetchS3Objects("Harmonies/");
    console.log(s3ObjectPaths);
    // Array of unique folder names derived from the pathname of each object in the S3 bucket
    const uniqueNames: string[] = [];
    s3ObjectPaths.forEach((path) => {
      // extract only the folder names from the path
      const folderName = path!.split("/")[1];
      // create array of unique folder names
      if (uniqueNames.includes(folderName)) return;
      uniqueNames.push(folderName);
      // Make a new array that contains only unique folder names then for each one create a song object
      // then check if the url or even the harmonyObject contains the same song name push them to the correct song track list
      // array
    });

    // create data structure to hold folder name and an array of presigned urls
    uniqueNames.forEach((folderName) => {
      const songDataStructure = { song: folderName, urls: [] };
      trackList.push(songDataStructure);
    });

    // get presigned url from aws, and return an object with the url and file name
    const createPresignedUrlWithClient = async (pathToFile: string) => {
      let trackName;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: pathToFile,
        ResponseContentDisposition: "attachment",
      });
      // get signed url for each object
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      // Handle file name format
      if (pathToFile) {
        // Split pathToFile and get the last part
        const fileName = pathToFile.split("/").pop();
        if (fileName) {
          // Remove .ma4 .mp3 or .pdf extension and replace hyphens with spaces
          trackName = fileName
            .replace(/\.(m4a|mp3|.pdf)$/, "")
            .replace(/-/g, " ");
          if (!trackName) return null;
        }
      }
      return { trackName, url };
    };
    // await all promises to resolve & call function to create objects for each s3 object
    const arrayOfNamesAndUrls = await Promise.all(
      s3ObjectPaths.map(async (path: string | undefined) => {
        const result = await createPresignedUrlWithClient(path!);

        return result;
      })
    );

    arrayOfNamesAndUrls.forEach((element: any) => {
      if (element.trackName) {
        const song = element.trackName.trim().split(" ")[0]; // Trim whitespace and get the first word
        if (song) {
          const match = trackList.find((track: { song: string }) =>
            track.song.includes(song)
          );
          console.log(match);
          if (match) {
            match.urls.push(element.url);
          }
        }
      }
    });

    return res.status(200).json({ trackList });
  } catch (err: any) {
    return res.status(500).json({ error: "Unable to fetch data" });
  }
}
