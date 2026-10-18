import { NextApiRequest, NextApiResponse } from "next";

import { currentHoliday } from "@/src/lib/holidays";

// Public: the holiday on today, if any, for the Book a taster form's banner.
//   GET -> { holiday: { back_on: "YYYY-MM-DD" } | null }
// The website's pages are built ahead of time, so the form asks for this when
// it opens. Vercel keeps the answer for 5 minutes so every visitor doesn't
// hit the database - a holiday added or removed shows within that time.
export default async function holidaysCurrent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const holiday = await currentHoliday();
    res.setHeader("Cache-Control", "public, s-maxage=300");
    return res.status(200).json({ holiday });
  } catch (error) {
    // No banner is better than a broken form
    // eslint-disable-next-line no-console
    console.error("Couldn't check for a holiday", error);
    return res.status(200).json({ holiday: null });
  }
}
