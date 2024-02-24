import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

  try {
    // array of objects, containing the path and a signed url
    const harmonyObjectArray: { url: string; name: string }[] = [];

    const s3ObjectPaths = await fetchS3Objects("Harmonies/");

    // get presigned url from aws, and return an object with the url and file path
    const createPresignedUrlWithClient = async (pathToFile: string) => {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: pathToFile,
        ResponseContentDisposition: "attachment",
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      harmonyObjectArray.push({ url, name: pathToFile });
    };
    // await all promises t o resolve & call function to create objects for each s3 object
    await Promise.all(
      s3ObjectPaths.map(async (path: string | undefined) => {
        if (path) await createPresignedUrlWithClient(path);
      })
    );
    return res.status(200).json({ url: harmonyObjectArray });
  } catch (err: any) {
    return res.status(500).json({ error: "Unable to fetch data" });
  }
}
