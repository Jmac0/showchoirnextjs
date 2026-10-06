import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { cleanEmail, isEmail, listDDMembers } from "@/src/lib/ddMembers";
import Members from "@/src/lib/models/member";

// DD members admin - one member (admins only).
//   PATCH { first_name, last_name, email }   correct their details before
//     they're invited, e.g. GoCardless has the parent who pays, not the
//     singer. Changing the email means a new invite is needed (the old
//     link no longer works), so they go back to "Not sent".
// Not once they've set up their account - they manage it themselves then.
export default async function ddMember(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: "Member not found" });
  }
  const member = await Members.findById(id);
  if (!member) return res.status(404).json({ message: "Member not found" });
  if (member.invite?.status === "accepted") {
    return res.status(400).json({
      message: "They've already set up their account - they can update it",
    });
  }

  const firstName = String(req.body?.first_name || "").trim();
  const lastName = String(req.body?.last_name || "").trim();
  const email = cleanEmail(req.body?.email);
  if (!firstName || !lastName || !isEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please give a first name, last name and email" });
  }

  const emailChanged = email !== member.email;
  if (emailChanged && (await Members.exists({ email }))) {
    return res
      .status(409)
      .json({ message: "Another member already uses that email" });
  }

  await Members.updateOne(
    { _id: member.id },
    {
      first_name: firstName,
      last_name: lastName,
      email,
      ...(emailChanged ? { "invite.status": "not_sent" } : {}),
    }
  );
  return res.status(200).json({ members: await listDDMembers() });
}
