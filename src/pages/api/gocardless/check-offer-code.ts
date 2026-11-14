import { NextApiRequest, NextApiResponse } from "next";

import { checkOfferCode, offerDescription } from "@/src/lib/joinOffers";

/* The monthly sign-up form checks an offer code as it's typed in, to show
what they'll pay. POST { code } -> 200 { description } or 400 { message }.
Only says whether a code works - the codes themselves never go to the
browser. The sign-up (mandateflow.ts) checks it again, with their choir. */
export default function checkOfferCodeRoute(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const check = checkOfferCode(req.body?.code);
  if ("message" in check) {
    return res.status(400).json({ message: check.message });
  }
  const { offer } = check;
  return res.status(200).json({
    description: `${offer.name} offer: ${offerDescription(offer)}. For ${
      offer.choir
    } members.`,
    choir: offer.choir,
  });
}
