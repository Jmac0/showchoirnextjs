import bcrypt from "bcrypt";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/src/lib/dbConnect";
import Members from "@/src/lib/models/member";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

// Same rule as creating an account (api/signup/createPassword.ts)
const MIN_PASSWORD_LENGTH = 4;

/* Lets a member logged in to the website change their password, from the
dashboard's Account tab (components/members/ChangePasswordForm.tsx).

They must give their current password, so someone using a computer they've
left logged in can't change it. Changing it also signs them out of the app
on every phone (their app refresh tokens are cleared), in case someone else
knew the old password. Their website session stays logged in.
POST { currentPassword, newPassword } */
export default async function changePassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Who: the member logged in to the website ---

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) {
    return res.status(401).json({ message: "Please log in again" });
  }

  // --- Check the new password ---

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res
      .status(400)
      .json({ message: "Please enter your current password" });
  }
  if (
    typeof newPassword !== "string" ||
    newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      message: `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({
      message: "Your new password must be different from your current one",
    });
  }

  try {
    await dbConnect();
    // The password isn't returned unless asked for (select: false)
    const member = await Members.findOne({ email }).select("+password");
    if (!member?.password) {
      return res.status(404).json({ message: "Account not found" });
    }

    // --- Check their current password is right ---

    if (!(await bcrypt.compare(currentPassword, member.password))) {
      return res
        .status(400)
        .json({ message: "Your current password is incorrect" });
    }

    // --- Save the new one and sign them out of the app everywhere ---

    await Members.updateOne(
      { _id: member.id },
      { password: await bcrypt.hash(newPassword, 8), refresh_tokens: [] }
    );

    return res
      .status(200)
      .json({ message: "Your password has been changed", status: 200 });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
}
