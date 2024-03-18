// // TODO remove this eslint rule
// /* eslint-disable no-inner-declarations */
// import type { NextApiRequest, NextApiResponse } from "next";
// import { getServerSession } from "next-auth/next";

// import { localMusicData } from "@/src/devData/localMusicData";
// import {
//   createDataStructure,
//   createPresignedUrlAndTrackName,
//   fetchS3Objects,
//   s3,
// } from "@/src/lib/aws/fetchS3MusicData";
// import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// const bucketName = process.env.S3_BUCKET_NAME as string;
// // returns an array of objects containing a presigned url & the name/path of each harmony file
// export default async function getMusic(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   // const session = await getServerSession(req, res, authOptions);
//   // if (!session) {
//   //   return res.status(401).json({ failure: "unauthenticated" });
//   // }
//   // Return local music data for development environment
//   // if (process.env.NODE_ENV === "development")
//   //   return res.status(200).json({
//   //     trackList: localMusicData,
//   //   });

//   try {
//     const s3ObjectPaths = await fetchS3Objects("Harmonies/");
//     const trackList = createDataStructure(s3ObjectPaths);
//     /// /////////////////////////////////////////////////////////////////////////////////////////////

//     // await all promises to resolve & call function to create objects for each s3 object
//     const arrayOfNamesAndUrls = await Promise.all(
//       s3ObjectPaths.map(async (path: string | undefined) => {
//         if (!path) return null;
//         const result = await createPresignedUrlAndTrackName(path);
//         return result;
//       })
//     );
//     if (!arrayOfNamesAndUrls.length) {
//       return res
//         .status(500)
//         .json({ failure: "fail", error: "Unable to fetch data" });
//     }
//     arrayOfNamesAndUrls.forEach((element) => {
//       if (!element || !element.trackName || !element.url) return;

//       // Trim whitespace and get the first word
//       const song = element.trackName.split(" ")[0];
//       const title = element.trackName;

//       if (song) {
//         const match = trackList.find((track) => track.song.includes(song));
//         if (match) {
//           match.urls.push({ url: element.url, trackName: title });
//         }
//       }
//     });

//     return res.status(200).json({ trackList });
//   } catch (err: any) {
//     return res.status(500).json({ error: "Unable to fetch data" });
//   }
// }
