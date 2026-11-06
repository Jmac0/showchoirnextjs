import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import { metaAudienceChoice } from "@/src/lib/metaAudience";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

/* A member changing their answer to the optional Meta tick, from the website
dashboard's Account tab (components/members/MetaAudienceSwitch.tsx).
POST { optIn: true | false } */
export default async function metaAudience(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    return res.status(401).json({ message: "Please log in again" });
  }

  const { optIn } = (req.body ?? {}) as { optIn?: unknown };
  if (typeof optIn !== "boolean") {
    return res.status(400).json({ message: "Please choose yes or no" });
  }

  try {
    await dbConnect();
    const { matchedCount } = await Members.updateOne(
      { email },
      { meta_audience: metaAudienceChoice(optIn) }
    );
    if (!matchedCount) {
      return res.status(401).json({ message: "Please log in again" });
    }
    return res.status(200).json({ optIn });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Meta choice not saved:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Something went wrong - please try again" });
  }
}
