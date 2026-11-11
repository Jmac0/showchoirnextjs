import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { listProducts, saveProduct } from "@/src/lib/shop";
import { checkProduct } from "@/src/lib/shopShared";

/* Kit shop products (admins only).
  GET  -> { products }
  POST { name, description, price, has_sizes, sizes, visible, sort_order,
         image_keys } -> 201 { products }
Adding a product also creates it in Stripe. If Stripe can't be reached the
product is still saved (502) - saving it again tries Stripe again. */
export default async function adminShopProducts(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const requestHost = req.headers.host;
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ products: await listProducts({ requestHost }) });
  }

  const fields = checkProduct(req.body || {});
  if ("error" in fields) return res.status(400).json({ message: fields.error });

  try {
    const problem = await saveProduct(null, fields);
    if (problem)
      return res.status(problem.status).json({ message: problem.error });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "💥 Shop product Stripe sync failed:",
      (error as Error).message
    );
    return res.status(502).json({
      message:
        "Saved, but Stripe couldn't be updated - it can't be bought until you save it again",
      products: await listProducts({ requestHost }),
    });
  }
  return res
    .status(201)
    .json({ products: await listProducts({ requestHost }) });
}
