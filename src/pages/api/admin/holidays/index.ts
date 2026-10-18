import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { isRealDate, listHolidays } from "@/src/lib/holidays";
import { MAX_HOLIDAY_NOTE } from "@/src/lib/holidaysShared";
import Holidays from "@/src/lib/models/holiday";

// Holidays admin (admins only).
//   GET                              every holiday, soonest first
//   POST { start, back_on, note }    add one - first day off and the day
//     rehearsals start again, as "YYYY-MM-DD"
export default async function holidays(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method === "GET") {
    return res.status(200).json({ holidays: await listHolidays() });
  }

  if (req.method === "POST") {
    const { start, back_on: backOn } = req.body || {};
    const note = String(req.body?.note || "")
      .trim()
      .slice(0, MAX_HOLIDAY_NOTE);
    if (!isRealDate(start) || !isRealDate(backOn)) {
      return res
        .status(400)
        .json({ message: "Please give the first day off and the day back" });
    }
    // "YYYY-MM-DD" strings sort the same as the dates they stand for
    if (backOn <= start) {
      return res
        .status(400)
        .json({ message: "The day back must be after the first day off" });
    }

    await Holidays.create({ start, back_on: backOn, note });
    return res.status(201).json({ holidays: await listHolidays() });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method Not Allowed" });
}
