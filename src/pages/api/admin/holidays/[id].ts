import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listHolidays } from "@/src/lib/holidays";
import Holidays from "@/src/lib/models/holiday";

// Holidays admin - one holiday (admins only).
//   DELETE   remove it (e.g. entered wrongly - delete and add it again)
export default async function holiday(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: "Holiday not found" });
  }
  const deleted = await Holidays.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Holiday not found" });

  return res.status(200).json({ holidays: await listHolidays() });
}
