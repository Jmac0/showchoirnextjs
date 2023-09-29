import type { NextApiRequest, NextApiResponse } from "next";

import { stripe } from "@/src/lib/stripe/stripeSetup";

export default async function Products(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await stripe.products
    .search({
      query: 'active:\'true\' AND metadata["type"]: "membership"',
    })
    .then((products) => res.status(200).json(products))
    .catch((err: { message: string }) => res.status(200).json(err.message));
}
