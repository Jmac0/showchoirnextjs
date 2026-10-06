import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import { hasActiveDirectDebit } from "@/src/lib/directDebit";
import Members from "@/src/lib/models/member";

// Most results to send back - enough to find someone, small enough to be quick
const MAX_RESULTS = 20;
// Shortest search worth running (avoids returning half the members for "a")
const MIN_QUERY_LENGTH = 2;

export type MemberSearchResult = {
  email: string;
  first_name: string;
  last_name: string;
  home_choir?: string;
  membership_type?: string;
  active_mandate: boolean;
  // Negative if they owe sessions after "pay later"
  flexi_sessions: number;
  is_ga: boolean;
};

// "Jo" -> /^Jo/i, with any regex characters in what was typed escaped
const startsWith = (word: string) =>
  new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

/* Find members by name, for the app's "Search by name" on the Scan tab - for
someone who turns up without their QR code. The GA then checks them in exactly
as if they'd scanned their card (by email, via check-in-member).

Every word typed must match the start of their first name, last name or
email, so "jam mac" finds Jamie Mac. GA only. Returns just what's needed to
pick the right person and see their status - no address, phone or password.
GET ?q=jam%20mac */
export default async function searchMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!(await requireGA(req, res))) return undefined;

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < MIN_QUERY_LENGTH) {
    return res.status(200).json({ results: [] });
  }

  // Each word must match the start of a first name, last name or email
  const words = query.split(/\s+/).slice(0, 4);
  const members = await Members.find({
    $and: words.map((word) => ({
      $or: [
        { first_name: startsWith(word) },
        { last_name: startsWith(word) },
        { email: startsWith(word) },
      ],
    })),
  })
    .select(
      "email first_name last_name home_choir membership_type active_mandate direct_debit_ended flexi_sessions role"
    )
    // case-insensitive A-Z by name
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: 1, last_name: 1 })
    .limit(MAX_RESULTS)
    .lean();

  const results: MemberSearchResult[] = members.map((member) => ({
    email: member.email,
    first_name: member.first_name,
    last_name: member.last_name,
    home_choir: member.home_choir,
    membership_type: member.membership_type,
    // Includes the grace period after a Direct Debit stops
    active_mandate: hasActiveDirectDebit(
      member as Parameters<typeof hasActiveDirectDebit>[0]
    ),
    flexi_sessions: member.flexi_sessions || 0,
    is_ga: member.role === "ga",
  }));

  return res.status(200).json({ results });
}
