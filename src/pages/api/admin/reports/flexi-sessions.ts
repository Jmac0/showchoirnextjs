import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { flexiSessionsReport } from "@/src/lib/reports";
import { isDateString } from "@/src/lib/ukDate";

// Flexi sessions report (admins only).
//   GET ?from=2026-09-01&to=2026-09-30    sessions used at check-in, and
//     flexi packs bought, between the two dates (both included)
export default async function flexiSessions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { from, to } = req.query;
  if (!isDateString(from) || !isDateString(to)) {
    return res.status(400).json({ message: "Please choose both dates" });
  }
  // "YYYY-MM-DD" strings sort the same as the dates they stand for
  if (to < from) {
    return res
      .status(400)
      .json({ message: "The end date must be on or after the start date" });
  }

  return res.status(200).json(await flexiSessionsReport(from, to));
}
