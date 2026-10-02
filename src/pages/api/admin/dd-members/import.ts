import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listDDMembers } from "@/src/lib/ddMembers";
import { importFromGoCardless } from "@/src/lib/gocardlessImport";

// Vercel: a few hundred members means a few paged GoCardless lists plus a
// database write each - allow longer than the default
export const config = { maxDuration: 60 };

// DD members admin - "Import from GoCardless" (admins only).
//   POST   creates a member for every GoCardless customer with an active
//          subscription who isn't here yet (see lib/gocardlessImport.ts).
//          Returns what it did, and the updated list.
export default async function importDDMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const summary = await importFromGoCardless();
    return res.status(200).json({ summary, members: await listDDMembers() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 GoCardless import failed:", (error as Error).message);
    return res.status(500).json({
      message: "Couldn't read from GoCardless - please try again",
    });
  }
}
