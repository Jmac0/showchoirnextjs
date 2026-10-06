import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireGA } from "@/src/lib/auth/requireGA";
import { applyCors } from "@/src/lib/cors";
import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";

// Removes a check-in (a mis-scan, or scanned under the wrong venue) and
// reverses everything it did to the member's balance: gives back the flexi
// session it used, and takes off a pack bought at the desk with it.
// POST { checkin_id }
export default async function undoCheckIn(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) {
    // applyCors has already ended the response for OPTIONS preflight requests.
    return undefined;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { checkin_id: checkinId } = req.body as { checkin_id?: string };
  if (!isValidObjectId(checkinId)) {
    return res.status(400).json({ message: "checkin_id is required" });
  }

  if (!(await requireGA(req, res))) return undefined;

  // Delete first, so undoing twice can't refund twice.
  const checkin = await Checkins.findOneAndDelete({ _id: checkinId });
  if (!checkin) {
    return res.status(404).json({ message: "Check-in not found" });
  }

  // Work out how much to change their balance by, to put it back to where it
  // was before the scan:
  //   normal flexi scan (used 1)                ->  +1
  //   pay later (used 1, went negative)         ->  +1
  //   cash/card at the desk (added 10, used 1)  ->  -9
  //   Direct Debit member (nothing changed)     ->   0, so skip the update
  const sessionChange =
    (checkin.flexi_deducted ? 1 : 0) - (checkin.sessions_added || 0);
  if (sessionChange || checkin.sessions_added) {
    await Members.updateOne(
      { _id: checkin.member_id },
      {
        $inc: { flexi_sessions: sessionChange },
        // Remove the top-up entry a desk payment added (see record-payment)
        $pull: { topUpDate: { checkin_id: checkin.id } },
      }
    );
  }

  return res.status(200).json({ message: "Check-in removed" });
}
