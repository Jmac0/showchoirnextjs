import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { metaAudienceEmails } from "@/src/lib/reports";

// The members who agreed to their email going to Meta (admins only).
//   GET              how many there are
//   GET ?download=1  their emails as a file to upload to Meta
export default async function metaAudience(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const emails = await metaAudienceEmails();
  if (req.query.download !== "1") {
    return res.status(200).json({ total: emails.length });
  }

  // Emails only, as nothing else is needed. Not to be kept by the browser.
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="show-choir-meta-list.csv"'
  );
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(["email", ...emails].join("\n"));
}
