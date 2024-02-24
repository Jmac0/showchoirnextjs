import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

const bucketName = process.env.S3_BUCKET_NAME as string;
const bucketRegion = process.env.S3_BUCKET_REGION as string;
const s3AuthOptions = {
  region: bucketRegion,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_SECRET_KEY as string,
  },
};
const s3 = new S3Client(s3AuthOptions);

export default async function getMusic(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ failure: "unauthenticated" });
  }

  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    StartAfter: "Harmonies/",

    // The default and maximum number of keys returned is 1000. This limits it to
    // one for dlemonstration purposes.
    MaxKeys: 500,
  });
  // array of paths to all objects in /Harmonies in S3 bucket
  let pathArray: any[] = [];
  // array of objects, the path and a signed url
  const harmonyObjectArray: object[] = [];
  try {
    let isTruncated: boolean | undefined = true;

    while (isTruncated) {
      // eslint-disable-next-line no-await-in-loop
      const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
        listObjectsCommand
      );
      if (Contents) {
        pathArray = Contents.map((c) => c.Key);
        isTruncated = IsTruncated;
        listObjectsCommand.input.ContinuationToken = NextContinuationToken;
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  // get presigned url frm aws, and return an object with the url and file path
  const createPresignedUrlWithClient = async (pathToFile: string) => {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: pathToFile,
      ResponseContentDisposition: "attachment",
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const obj = { url, name: pathToFile };
    harmonyObjectArray.push(obj);
  };
  pathArray = pathArray.slice(1);

  await Promise.all(
    pathArray.map(async (path: string) => {
      await createPresignedUrlWithClient(path);
    })
  );
  return res.status(200).json({ url: harmonyObjectArray });
}
