import { NextApiRequest, NextApiResponse } from "next";

import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { deleteProduct, listProducts, saveProduct } from "@/src/lib/shop";
import { checkProduct } from "@/src/lib/shopShared";

/* One kit shop product (admins only).
  PATCH  { the same fields as adding one } -> { products }
  DELETE -> { products, message? } - a product that's been ordered is
            hidden instead of deleted (its orders still need it) */
export default async function adminShopProduct(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", "PATCH, DELETE");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return undefined;

  const { id } = req.query;
  const requestHost = req.headers.host;

  try {
    if (req.method === "DELETE") {
      const result = await deleteProduct(id);
      if (!result)
        return res.status(404).json({ message: "Product not found" });
      return res.status(200).json({
        products: await listProducts({ requestHost }),
        ...(result === "hidden"
          ? {
              message:
                "It's been ordered before, so it's been hidden from the shop instead of deleted",
            }
          : {}),
      });
    }

    const fields = checkProduct(req.body || {});
    if ("error" in fields) {
      return res.status(400).json({ message: fields.error });
    }
    const problem = await saveProduct(id, fields);
    if (problem) {
      return res.status(problem.status).json({ message: problem.error });
    }
    return res
      .status(200)
      .json({ products: await listProducts({ requestHost }) });
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
}
