import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import {
  signedFileUrl,
  storageEndpointFor,
  uploadUrlFor,
} from "@/src/lib/music";
import { newImageKey } from "@/src/lib/shop";
import { imageUploadProblem } from "@/src/lib/shopShared";

/* Kit shop - adding a product photo (admins only). Same idea as Music &
Lyrics: the admin's browser uploads the photo straight to R2.
  POST { fileName, contentType, size }
  -> { uploadUrl, key, previewUrl }
The browser PUTs the photo to uploadUrl, shows it from previewUrl, and sends
the key with the product when it's saved (which checks it arrived). */
export default async function shopImageUploadUrl(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const { fileName, contentType, size } = (req.body || {}) as Record<
    string,
    unknown
  >;
  if (typeof fileName !== "string" || !fileName) {
    return res.status(400).json({ message: "Please choose a photo" });
  }
  const problem = imageUploadProblem(String(contentType || ""), Number(size));
  if (problem) return res.status(400).json({ message: problem });

  const key = newImageKey(fileName);
  return res.status(200).json({
    uploadUrl: await uploadUrlFor(key, String(contentType), Number(size)),
    key,
    previewUrl: await signedFileUrl(key, storageEndpointFor(req.headers.host)),
  });
}
