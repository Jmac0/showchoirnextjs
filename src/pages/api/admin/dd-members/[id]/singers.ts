import { isValidObjectId } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { cleanEmail, isEmail, listDDMembers } from "@/src/lib/ddMembers";
import Members from "@/src/lib/models/member";

// DD members admin - add another singer to someone's Direct Debit (admins
// only), e.g. a parent paying for two children, or a couple on one mandate.
//   POST { first_name, last_name, email }
// The new singer gets their own member record and login (so their own
// membership card), active because the payer's Direct Debit is - and linked
// to it (same GoCardless customer and mandate), so if that Direct Debit is
// cancelled they're made inactive too (api/gocardless/webhooks.ts).
export default async function addSinger(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return res;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: "Member not found" });
  }
  const payer = await Members.findById(id);
  if (!payer?.mandate) {
    return res
      .status(404)
      .json({ message: "That member doesn't have a Direct Debit" });
  }

  const firstName = String(req.body?.first_name || "").trim();
  const lastName = String(req.body?.last_name || "").trim();
  const email = cleanEmail(req.body?.email);
  if (!firstName || !lastName || !isEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please give a first name, last name and email" });
  }
  if (await Members.exists({ email })) {
    return res
      .status(409)
      .json({ message: "Another member already uses that email" });
  }

  await Members.create({
    first_name: firstName,
    last_name: lastName,
    email,
    // Usually the same household - they can change it when they sign up
    street_address: payer.street_address || "",
    town_city: payer.town_city || "",
    county: payer.county || "",
    post_code: payer.post_code || "",
    phone_number: "",
    home_choir: "",
    age_confirm: false,
    consent: false,
    membership_type: "DD",
    active_mandate: !!payer.active_mandate,
    active_member: true,
    go_cardless_id: payer.go_cardless_id,
    mandate: payer.mandate,
    gc_mandate_status: payer.gc_mandate_status,
    date_joined: payer.date_joined,
    direct_debit_started: payer.direct_debit_started,
    direct_debit_cancelled: "",
    topUpDate: [],
    role: "",
    paid_by_member: payer.id,
    invite: { status: "not_sent", send_count: 0 },
  });
  return res.status(201).json({ members: await listDDMembers() });
}
