import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

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
// get paths of all objects in S3 bucket
export async function fetchS3Objects(parentFolder: string) {
  let pathArray: (string | undefined)[] = [];
  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    StartAfter: parentFolder,

    // The default and maximum number of keys returned is 1000. This limits it to
    // one for dlemonstration purposes.
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
