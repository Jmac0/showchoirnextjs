import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { getJWTPayload } from "@/src/lib/auth/verifyJWT";
import { applyCors } from "@/src/lib/cors";
import dbConnect from "@/src/lib/dbConnect";
import { directDebitFormUrl } from "@/src/lib/gocardless";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";
import { HeadersType } from "@/src/types/types";

/* "Set up a new Direct Debit" - for a Direct Debit member whose Direct Debit
has stopped (the notice on their Account page and the app's home screen).
They're logged in, so we already know who they are: no form to fill in again,
just GoCardless's Direct Debit form with their details filled in.

POST, logged in on the website (session) or in the app (Bearer token).
Returns { authorisation_url } - the page/app sends them there. When they
finish it, the GoCardless webhook finds them by email, makes their Direct
Debit active again and clears the notice (api/gocardless/webhooks.ts). */
export default async function restartDirectDebit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return res;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who's asking: the app sends a token, the website has a session ---

  await dbConnect();
  const payload = getJWTPayload(req.headers as HeadersType["headers"]);
  let member = payload ? await Members.findById(payload.id) : null;
  if (!payload) {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.email) {
      member = await Members.findOne({ email: session.user.email });
    }
  }
  if (!member) return res.status(401).json({ message: "Please log in again" });

  // Only for Direct Debit members whose Direct Debit has stopped
  if (member.membership_type !== "DD" || member.active_mandate) {
    return res
      .status(400)
      .json({ message: "Your Direct Debit is already active" });
  }

  try {
    // This site's address as the member reached it (the app calls the
    // site's own address, e.g. a LAN IP in development)
    const site =
      req.headers.origin ||
      `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    const authorisationUrl = await directDebitFormUrl({
      member,
      redirectUri: `${site}/direct-debit-thanks`,
      exitUri: `${site}/direct-debit-thanks?cancelled=1`,
    });
    return res.status(200).json({ authorisation_url: authorisationUrl });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Direct Debit restart failed:", (error as Error).message);
    return res.status(500).json({
      message: "Sorry, we couldn't start your Direct Debit - please try again",
    });
  }
}
