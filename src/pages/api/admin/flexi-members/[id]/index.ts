import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { changeMemberEmail } from "@/src/lib/changeMemberEmail";
import { cleanEmail, isEmail } from "@/src/lib/ddMembers";
import { listFlexiMembers } from "@/src/lib/flexiMembers";
import Members from "@/src/lib/models/member";

// Flexi members admin - one member's details (admins only).
//   PATCH { first_name, last_name, email }   correct their details before
//     they're invited. A new email is changed everywhere (Mailchimp -
//     lib/changeMemberEmail.ts), and an invite already sent goes back to
//     "Not sent" (its link had the old email).
// Not once they've set up their account - they manage it themselves then.
export default async function flexiMember(
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
  const member = await Members.findOne({
    _id: id,
    imported_from_mailchimp: true,
  });
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

  try {
    if (emailChanged) await changeMemberEmail(member, email);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "💥 Flexi member email change failed:",
      (error as Error).message
    );
    return res
      .status(500)
      .json({ message: "Sorry, the email couldn't be changed - try again" });
  }
  await Members.updateOne(
    { _id: member.id },
    { first_name: firstName, last_name: lastName }
  );
  return res.status(200).json({ members: await listFlexiMembers() });
}
