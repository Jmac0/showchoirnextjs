import mongoose, { isValidObjectId } from "mongoose";
import Stripe from "stripe";

import dbConnect from "@/src/lib/dbConnect";
import { sendShopOrderEmails } from "@/src/lib/email/sendShopOrderEmails";
import ShopOrders, { ShopOrderType } from "@/src/lib/models/shopOrder";
import ShopProducts, { ShopProductType } from "@/src/lib/models/shopProduct";
import {
  deleteFiles,
  safeFileName,
  signedFileUrl,
  storageEndpointFor,
  uploadedSize,
} from "@/src/lib/music";
import {
  describeItem,
  Fulfilment,
  fulfilmentLabel,
  orderReference,
  priceBasket,
  ProductFields,
  ShopOrderRow,
  ShopProductRow,
} from "@/src/lib/shopShared";
import { stripe } from "@/src/lib/stripe/stripeSetup";

/* Members' kit shop - SERVER ONLY (Stripe, database, storage).
Browser-safe bits: shopShared.ts.

  - Products live in MongoDB (models/shopProduct.ts), set up by admins. Each
    has a matching Stripe product and price, created/updated from here, so
    the Stripe dashboard shows what sold.
  - Photos are in the private R2 bucket (same as Music & Lyrics), shown with
    signed links made fresh on each visit.
  - Orders (models/shopOrder.ts) are saved "pending" before the member goes
    to Stripe's checkout page, and marked "paid" when Stripe tells the
    webhook (api/stripe/webhooks.ts) - or when the member comes back, if
    that's first. Whichever is first sends the emails; the other does nothing.
  - No stock and no postage: everything is made to order and handed out at
    the member's choir. */

type ProductDoc = ShopProductType & { _id: mongoose.Types.ObjectId };
type OrderDoc = ShopOrderType & { _id: mongoose.Types.ObjectId };

// --- Products ---

// Where a new photo goes: shop/<random id>-<file-name> (SHOP_IMAGE_KEY)
export const newImageKey = (fileName: string) =>
  `shop/${new mongoose.Types.ObjectId().toString()}-${safeFileName(
    fileName
  ).slice(0, 90)}`;

async function toProductRow(
  product: ProductDoc,
  endpoint: string
): Promise<ShopProductRow> {
  return {
    id: String(product._id),
    name: product.name,
    description: product.description || "",
    price_pence: product.price_pence,
    images: await Promise.all(
      (product.images || []).map(async ({ key }) => ({
        key,
        url: await signedFileUrl(key, endpoint),
      }))
    ),
    has_sizes: !!product.has_sizes,
    sizes: product.sizes || [],
    visible: !!product.visible,
    sort_order: product.sort_order || 0,
    on_stripe: !!product.stripe_price_id,
  };
}

// The products, in shop order. visibleOnly: just what members can buy.
// requestHost: only matters in local development (see storageEndpointFor).
export async function listProducts({
  visibleOnly = false,
  requestHost,
}: { visibleOnly?: boolean; requestHost?: string } = {}) {
  await dbConnect();
  const products = await ShopProducts.find(
    visibleOnly ? { visible: true, stripe_price_id: { $nin: ["", null] } } : {}
  )
    .sort({ sort_order: 1, name: 1 })
    .lean();
  const endpoint = storageEndpointFor(requestHost);
  return Promise.all(
    products.map((product) => toProductRow(product as ProductDoc, endpoint))
  );
}

// Brings the Stripe product and price into line with ours: creates them the
// first time, then keeps the name, description and on/off in step. Stripe
// prices can't be changed, so a new price creates a new Stripe price (and
// switches the old one off). Saves the Stripe ids on the product.
export async function syncStripeProduct(
  product: mongoose.HydratedDocument<ShopProductType>
) {
  const details = {
    name: product.name,
    // Stripe won't take an empty description when creating
    ...(product.description ? { description: product.description } : {}),
    active: product.visible,
  };
  if (!product.stripe_product_id) {
    const created = await stripe.products.create({
      ...details,
      metadata: { kind: "shop", product_id: String(product._id) },
    });
    product.set("stripe_product_id", created.id);
    await product.save();
  } else {
    await stripe.products.update(product.stripe_product_id, {
      ...details,
      // "" clears it in Stripe when the admin has removed the description
      description: product.description || "",
    });
  }

  if (
    product.stripe_price_id &&
    product.stripe_price_pence === product.price_pence
  ) {
    return;
  }
  const oldPrice = product.stripe_price_id;
  const price = await stripe.prices.create({
    product: product.stripe_product_id as string,
    currency: "gbp",
    unit_amount: product.price_pence,
  });
  await stripe.products.update(product.stripe_product_id as string, {
    default_price: price.id,
  });
  if (oldPrice) await stripe.prices.update(oldPrice, { active: false });
  product.set({
    stripe_price_id: price.id,
    stripe_price_pence: product.price_pence,
  });
  await product.save();
}

// Photos named on a product must really have been uploaded
async function missingImage(keys: string[]) {
  const sizes = await Promise.all(keys.map((key) => uploadedSize(key)));
  return sizes.some((size) => size === null);
}

// Adds (id = null) or changes a product, then updates Stripe. Returns an
// error message if a photo is missing or there's no such product. If Stripe
// can't be reached, the product is still saved and this throws - saving it
// again later tries Stripe again (until then it can't be bought).
export async function saveProduct(
  id: unknown,
  fields: ProductFields
): Promise<{ error: string; status: number } | null> {
  await dbConnect();
  if (await missingImage(fields.image_keys)) {
    return {
      error: "A photo didn't finish uploading - please add it again",
      status: 400,
    };
  }
  const { image_keys: imageKeys, ...rest } = fields;
  const values = { ...rest, images: imageKeys.map((key) => ({ key })) };

  let product;
  let removedKeys: string[] = [];
  if (id === null) {
    product = await ShopProducts.create(values);
  } else {
    if (!isValidObjectId(id))
      return { error: "Product not found", status: 404 };
    product = await ShopProducts.findById(id);
    if (!product) return { error: "Product not found", status: 404 };
    removedKeys = product.images
      .map(({ key }) => key)
      .filter((key) => !imageKeys.includes(key));
    product.set(values);
    await product.save();
  }

  // Photos taken off the product aren't needed any more
  if (removedKeys.length) {
    try {
      await deleteFiles(removedKeys);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "Couldn't delete old shop photos:",
        (error as Error).message
      );
    }
  }

  await syncStripeProduct(product);
  return null;
}

// Deletes a product that's never been ordered. One that has been is hidden
// instead (its orders still need it) - returns "hidden" then. False if
// there's no such product.
export async function deleteProduct(id: unknown) {
  if (!isValidObjectId(id)) return false;
  await dbConnect();
  const product = await ShopProducts.findById(id);
  if (!product) return false;

  if (await ShopOrders.exists({ "items.product_id": product._id })) {
    product.set("visible", false);
    await product.save();
    await syncStripeProduct(product);
    return "hidden";
  }

  // Stripe products with prices can't be deleted - switched off instead
  if (product.stripe_product_id) {
    await stripe.products.update(product.stripe_product_id, { active: false });
  }
  await ShopProducts.deleteOne({ _id: product._id });
  try {
    await deleteFiles(product.images.map(({ key }) => key));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Couldn't delete shop photos:", (error as Error).message);
  }
  return "deleted";
}

// --- Orders ---

const toOrderRow = (order: OrderDoc): ShopOrderRow => ({
  id: String(order._id),
  reference: orderReference(String(order._id)),
  member_name: `${order.member?.first_name ?? ""} ${
    order.member?.last_name ?? ""
  }`.trim(),
  member_email: order.member?.email ?? "",
  items: (order.items || []).map((item) => ({
    product_id: String(item.product_id),
    name: item.name,
    size: item.size || "",
    quantity: item.quantity,
    unit_pence: item.unit_pence,
  })),
  venue: order.venue || "",
  note: order.note || "",
  total_pence: order.total_pence,
  fulfilment: order.fulfilment,
  paid_at: order.paid_at ? new Date(order.paid_at).toISOString() : null,
});

type Buyer = {
  _id: unknown;
  first_name?: string;
  last_name?: string;
  email: string;
};

// Saves the order (pending) and makes the Stripe checkout page for it.
// Prices come from the products as they are now, never from the browser.
// Returns the checkout page's address, or the message to show the member.
export async function startCheckout(
  member: Buyer,
  basket: { lines: unknown; venue: string; note: string },
  origin: string
): Promise<{ url: string } | { error: string }> {
  await dbConnect();
  const products = (await ShopProducts.find({
    visible: true,
    stripe_price_id: { $nin: ["", null] },
  }).lean()) as ProductDoc[];

  const priced = priceBasket(
    basket.lines,
    products.map((p) => ({
      id: String(p._id),
      name: p.name,
      price_pence: p.price_pence,
      has_sizes: p.has_sizes,
      sizes: p.sizes,
      visible: p.visible,
    }))
  );
  if ("error" in priced) return priced;

  const order = await ShopOrders.create({
    member_id: member._id,
    member: {
      first_name: member.first_name ?? "",
      last_name: member.last_name ?? "",
      email: member.email,
    },
    items: priced.items.map((item) => ({
      ...item,
      product_id: new mongoose.Types.ObjectId(item.product_id),
    })),
    venue: basket.venue,
    note: basket.note,
    total_pence: priced.total_pence,
  });
  const orderId = String(order._id);

  // One Stripe line per product - sizes are in our order (Stripe would show
  // the same product twice otherwise). Same total either way.
  const quantities = new Map<string, number>();
  priced.items.forEach((item) => {
    const product = products.find((p) => String(p._id) === item.product_id);
    const price = product?.stripe_price_id as string;
    quantities.set(price, (quantities.get(price) || 0) + item.quantity);
  });

  const shopUrl = `${origin}/members/shop`;
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: member.email,
    line_items: Array.from(quantities, ([price, quantity]) => ({
      price,
      quantity,
    })),
    success_url: `${shopUrl}?order=${orderId}`,
    cancel_url: `${shopUrl}?cancelled=1`,
    automatic_tax: { enabled: false },
    // Read by the webhook when the payment succeeds:
    //   kind    - "shop", so it's not mistaken for a Flexi payment
    //   orderId - the order to mark paid
    //   user    - the member's email (for anyone looking in Stripe)
    payment_intent_data: {
      description: `Show Choir kit order ${orderReference(orderId)}`,
      metadata: { kind: "shop", orderId, user: member.email },
    },
    metadata: { kind: "shop", orderId },
  });

  order.set("stripe_session_id", checkout.id);
  await order.save();
  return { url: checkout.url as string };
}

// Marks a pending order paid and sends the emails - only the first time it's
// called for an order (Stripe can tell us twice, and the member's return to
// the shop can get there first). Returns the order, or null if there's no
// such pending order.
export async function completeOrder(
  orderId: unknown,
  payment: { id: string; amount_pence: number }
) {
  if (!isValidObjectId(orderId)) return null;
  await dbConnect();
  const order = (await ShopOrders.findOneAndUpdate(
    { _id: orderId, status: "pending" },
    {
      status: "paid",
      paid_at: new Date(),
      stripe_payment_intent: payment.id,
      amount_paid_pence: payment.amount_pence,
    },
    { new: true }
  ).lean()) as OrderDoc | null;
  if (!order) return null;

  try {
    await sendShopOrderEmails(toOrderRow(order));
  } catch (error) {
    // Not worth failing over - the order is saved and shows on the Orders page
    // eslint-disable-next-line no-console
    console.error(
      `💥 Shop order email failed (${orderId}):`,
      (error as Error).message
    );
  }
  return order;
}

// When the member comes back from paying: if Stripe's message hasn't
// arrived yet, ask Stripe directly so the thank-you shows straight away.
// Only for the member's own order. Returns the order, or null.
export async function confirmReturningOrder(
  orderId: unknown,
  memberId: unknown
) {
  if (!isValidObjectId(orderId)) return null;
  await dbConnect();
  const order = (await ShopOrders.findOne({
    _id: orderId,
    member_id: memberId,
  }).lean()) as OrderDoc | null;
  if (!order) return null;
  if (order.status === "paid") return toOrderRow(order);
  if (!order.stripe_session_id) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(
      order.stripe_session_id
    );
    if (session.payment_status !== "paid") return null;
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id;
    await completeOrder(order._id, {
      id: paymentIntent || session.id,
      amount_pence: session.amount_total ?? order.total_pence,
    });
    const paid = (await ShopOrders.findById(order._id).lean()) as OrderDoc;
    return paid?.status === "paid" ? toOrderRow(paid) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Couldn't check shop payment:", (error as Error).message);
    return null;
  }
}

// A member's own paid orders, newest first
export async function memberOrders(memberId: unknown) {
  await dbConnect();
  const orders = await ShopOrders.find({ member_id: memberId, status: "paid" })
    .sort({ paid_at: -1 })
    .limit(50)
    .lean();
  return orders.map((order) => toOrderRow(order as OrderDoc));
}

// Paid orders for the admin Orders page, newest first, optionally just one
// choir and/or one fulfilment status
export async function listOrders(
  filters: { venue?: string; fulfilment?: Fulfilment } = {}
) {
  await dbConnect();
  const orders = await ShopOrders.find({
    status: "paid",
    ...(filters.venue ? { venue: filters.venue } : {}),
    ...(filters.fulfilment ? { fulfilment: filters.fulfilment } : {}),
  })
    .sort({ paid_at: -1 })
    .limit(1000)
    .lean();
  return orders.map((order) => toOrderRow(order as OrderDoc));
}

// False if there's no such paid order
export async function setFulfilment(id: unknown, fulfilment: Fulfilment) {
  if (!isValidObjectId(id)) return false;
  await dbConnect();
  return !!(await ShopOrders.findOneAndUpdate(
    { _id: id, status: "paid" },
    { fulfilment }
  ));
}

// Removes orders where the member went to Stripe but never paid (the
// checkout page itself expires after 24 hours). Returns how many.
export async function deleteAbandonedOrders(now = new Date()) {
  await dbConnect();
  const { deletedCount } = await ShopOrders.deleteMany({
    status: "pending",
    created_at: { $lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  });
  return deletedCount;
}

// --- The orders spreadsheet (CSV) ---

// One spreadsheet cell: quoted, and text that a spreadsheet would treat as
// a formula (=, +, -, @) made safe with a leading '
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// One row per item - handy for ordering from the supplier and sorting by
// choir. Starts with a BOM so Excel reads £ and accents properly.
const BOM = "\uFEFF";
export function ordersCsv(orders: ShopOrderRow[]) {
  const header = [
    "Order",
    "Paid",
    "Name",
    "Email",
    "Choir",
    "Item",
    "Size",
    "Quantity",
    "Price each",
    "Status",
    "Note",
  ];
  const rows = orders.flatMap((order) =>
    order.items.map((item) => [
      order.reference,
      order.paid_at ? order.paid_at.slice(0, 10) : "",
      order.member_name,
      order.member_email,
      order.venue,
      item.name,
      item.size,
      item.quantity,
      (item.unit_pence / 100).toFixed(2),
      fulfilmentLabel(order.fulfilment),
      order.note,
    ])
  );
  return `${BOM}${[header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}`;
}

// For the emails: "Hoodie (M) × 2, Water bottle × 1"
export const itemsSummary = (order: ShopOrderRow) =>
  order.items.map(describeItem).join(", ");
