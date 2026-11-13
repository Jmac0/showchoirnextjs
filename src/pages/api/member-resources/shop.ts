import { NextApiRequest, NextApiResponse } from "next";

import { requireActiveMember } from "@/src/lib/auth/requireActiveMember";
import { getChoirVenues } from "@/src/lib/contentfulClient";
import { applyCors } from "@/src/lib/cors";
import { listProducts, memberOrders } from "@/src/lib/shop";
import { choirNames } from "@/src/lib/venues";

/* The app's Shop tab - active members only (Bearer token).
  GET -> { products, venues, homeChoir, orders }
    products  - what's for sale, in shop order, with signed photo links
    venues    - the choirs we deliver to
    homeChoir - the member's own choir, chosen to start with
    orders    - their paid orders, newest first
The website's shop page gets the same in its getServerSideProps
(pages/members/shop.tsx). Paying: api/stripe/shop-payment-sheet.ts. */
export default async function appShop(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return undefined;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Logged in, with an active membership (sends 401/403 itself if not)
  const member = await requireActiveMember(req, res);
  if (!member) return undefined;

  try {
    const [products, venues, orders] = await Promise.all([
      listProducts({ visibleOnly: true, requestHost: req.headers.host }),
      getChoirVenues(),
      memberOrders(member._id),
    ]);
    return res.status(200).json({
      products,
      venues: choirNames(venues),
      homeChoir: member.home_choir || "",
      orders,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 App shop failed:", (error as Error).message);
    return res
      .status(500)
      .json({ message: "Couldn't load the shop - please try again" });
  }
}
