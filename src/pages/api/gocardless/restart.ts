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
  if (applyCors(req, res)) return undefined;
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

  // Only for Direct Debit members whose Direct Debit has stopped, and Flexi
  // members whose sessions expired (they're offered Direct Debit instead -
  // the webhook makes them a Direct Debit member when they finish)
  const canStart =
    (member.membership_type === "DD" && !member.active_mandate) ||
    member.membership_type === "flexi_expired";
  if (!canStart) {
    return res
      .status(400)
      .json({ message: "Your Direct Debit is already active" });
  }

  try {
    // Where GoCardless sends them back to: this site's address as the
    // member reached it - except GoCardless refuses IP addresses ("must use
    // a domain name"), which is how the app reaches the site in development
    // (e.g. http://192.168.0.94:3000), so then the configured address
    // (NEXT_PUBLIC_BASE_URL) is used instead. (In development that's
    // localhost, which a phone can't open - fine, the webhook does the work;
    // live it's the real domain.)
    const reached =
      req.headers.origin ||
      `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    const isIpAddress = /^https?:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(
      reached
    );
    const site =
      isIpAddress && process.env.NEXT_PUBLIC_BASE_URL
        ? process.env.NEXT_PUBLIC_BASE_URL
        : reached;
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
