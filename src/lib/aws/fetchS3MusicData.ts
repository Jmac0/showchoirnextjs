import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.S3_BUCKET_NAME as string;
const bucketRegion = process.env.S3_BUCKET_REGION as string;
const s3AuthOptions = {
  region: bucketRegion,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_SECRET_KEY as string,
  },
};

export const s3 = new S3Client(s3AuthOptions);
// get paths of all objects in S3 bucket. Argument is the parent folder to start at at ie /Harmonies
export async function fetchS3Objects(parentFolder: string) {
  let pathArray: (string | undefined)[] = [];
  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    StartAfter: parentFolder,

    // The default and maximum number of keys returned is 1000.
    MaxKeys: 500,
  });
  try {
    let isTruncated: boolean | undefined = true;

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        // eslint-disable-next-line no-await-in-loop
        await s3.send(listObjectsCommand);
      if (Contents) {
        pathArray = Contents.map((c) => c.Key);
        isTruncated = IsTruncated;
        listObjectsCommand.input.ContinuationToken = NextContinuationToken;
      }
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    throw new Error(err.message);
  }
  pathArray = pathArray.slice(1);
  return pathArray;
}

type TrackListData = {
  song: string;
  urls: { url: string; trackName: string }[];
}[];
// Function to map over the s3 object paths and create a data structure to store track data
export function createDataStructure(paths: (string | undefined)[]) {
  const uniqueNames: string[] = [];
  const trackDataStructure: TrackListData = [];
  paths.forEach((path) => {
    // extract only the folder names from the path
    if (!path) return;
    const folderName = path.split("/")[1];

    // create array of unique folder names as the folder name is in the path to every object
    if (uniqueNames.includes(folderName)) return;
    uniqueNames.push(folderName);
  });

  // create data structure to hold folder name and an array of presigned urls
  uniqueNames.forEach((folderName) => {
    const songDataStructure = { song: folderName, urls: [] };
    trackDataStructure.push(songDataStructure);
  });
  return trackDataStructure;
}

// get presigned url from aws, and return an object with the presigned url and file name
export async function createPresignedUrlAndTrackName(pathToFile: string) {
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
      trackName = fileName.replace(/\.(m4a|mp3|.pdf)$/, "").replace(/-/g, " ");
      if (!trackName) return null;
    }
  }
  return { trackName, url };
}
