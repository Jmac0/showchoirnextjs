import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { changeMemberEmail } from "@/src/lib/changeMemberEmail";
import { cleanEmail, isEmail } from "@/src/lib/ddMembers";
import Members, { isDuplicateEmailError } from "@/src/lib/models/member";

/* Change a member's email for them (admins only) - for members who ask by
email or phone instead of using "Change email" on their Account page. Any
member, not just Direct Debit ones. Changes it in GoCardless (if it has their
old email), our database and Mailchimp, like their own change does - see
lib/changeMemberEmail.ts. No confirmation link: the admin is trusted to have
checked it's really them.

POST { current_email, new_email }
Returns { message } saying what happened, including in GoCardless. */
export default async function adminChangeEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const currentEmail = cleanEmail(req.body?.current_email);
  const newEmail = cleanEmail(req.body?.new_email);
  if (!isEmail(newEmail)) {
    return res.status(400).json({ message: "Please check the new email" });
  }
  if (newEmail === currentEmail) {
    return res.status(400).json({ message: "That's already their email" });
  }

  const member = await Members.findOne({ email: currentEmail });
  if (!member) {
    return res
      .status(404)
      .json({ message: "No member has that email - please check it" });
  }
  if (await Members.exists({ email: newEmail })) {
    return res
      .status(409)
      .json({ message: "Another member already uses the new email" });
  }

  try {
    const goCardless = await changeMemberEmail(member, newEmail);
    const name = `${member.first_name} ${member.last_name}`.trim();
    const gcNote = {
      updated: " GoCardless updated too.",
      not_direct_debit: "",
      different_email: ` GoCardless has a different email${
        "email" in goCardless && goCardless.email
          ? ` (${goCardless.email})`
          : ""
      }, so it was left as it is.`,
    }[goCardless.status];
    return res.status(200).json({
      message: `${
        name ? `${name}'s` : "Their"
      } email is now ${newEmail}.${gcNote}`,
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res
        .status(409)
        .json({ message: "Another member already uses the new email" });
    }
    // eslint-disable-next-line no-console
    console.error("💥 Admin change email failed:", (error as Error).message);
    return res.status(500).json({
      message: "Sorry, that didn't work - please try again",
    });
  }
}
