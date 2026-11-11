import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listOrders, ordersCsv } from "@/src/lib/shop";
import { isFulfilment } from "@/src/lib/shopShared";

/* Kit shop orders (admins only) - paid orders, newest first.
  GET ?venue=Banstead&fulfilment=new -> { orders }
  GET ...&download=1                 -> the same as a spreadsheet (CSV),
                                        one row per item */
export default async function adminShopOrders(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const { venue, fulfilment, download } = req.query;
  const orders = await listOrders({
    venue: typeof venue === "string" && venue ? venue : undefined,
    fulfilment: isFulfilment(fulfilment) ? fulfilment : undefined,
  });

  if (download === "1") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="show-choir-kit-orders.csv"'
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(ordersCsv(orders));
  }
  return res.status(200).json({ orders });
}
