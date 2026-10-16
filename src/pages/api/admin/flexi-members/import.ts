import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { importFlexiFromMailchimp } from "@/src/lib/flexiImport";
import { listFlexiMembers } from "@/src/lib/flexiMembers";

// Vercel: a few hundred members means a few paged Mailchimp lists plus a
// database write each - allow longer than the default
export const config = { maxDuration: 60 };

// Flexi members admin - "Import from Mailchimp" (admins only).
//   POST   creates a member for every contact tagged "Flexi" in Mailchimp's
//          Choir audience who isn't here yet (see lib/flexiImport.ts).
//          Returns what it did, and the updated list.
export default async function importFlexiMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const summary = await importFlexiFromMailchimp();
    return res.status(200).json({ summary, members: await listFlexiMembers() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Flexi import failed:", (error as Error).message);
    const message = (error as Error).message || "";
    return res.status(500).json({
      // Not set up (env var missing) - say so; otherwise a Mailchimp problem
      message: message.startsWith("MAILCHIMP_CHOIR_LIST_ID")
        ? message
        : "Couldn't read from Mailchimp - please try again",
    });
  }
}
