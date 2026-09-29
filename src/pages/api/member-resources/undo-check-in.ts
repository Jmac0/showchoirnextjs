import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";

// Removes a check-in (a mis-scan, or scanned under the wrong venue) and gives
// back the flexi session it used, if any. POST { checkin_id }
export default async function undoCheckIn(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return res;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { checkin_id: checkinId } = req.body as { checkin_id?: string };
  if (!isValidObjectId(checkinId)) {
    return res.status(400).json({ message: "checkin_id is required" });
  }

  if (!(await requireGA(req, res))) return res;

  // Delete first, so undoing twice can't refund twice.
  const checkin = await Checkins.findOneAndDelete({ _id: checkinId });
  if (!checkin) {
    return res.status(404).json({ message: "Check-in not found" });
  }

  if (checkin.flexi_deducted) {
    await Members.updateOne(
      { _id: checkin.member_id },
      { $inc: { flexi_sessions: 1 } }
    );
  }

  return res.status(200).json({ message: "Check-in removed" });
}
