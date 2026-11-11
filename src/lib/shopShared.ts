// Members' kit shop - the parts that are safe to use in the browser as well
// as on the server (no Stripe, database or storage code here - that's
// lib/shop.ts). Used by the Shop page, the admin pages and the API routes.

// Offered when an admin ticks "Comes in sizes" - they can change the list
// for each product (e.g. drop XS, add 4XL)
export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export const MAX_PRODUCT_NAME = 80;
export const MAX_PRODUCT_DESCRIPTION = 1000;
export const MAX_SIZES = 15;
export const MAX_SIZE_LENGTH = 15;
export const MAX_IMAGES = 4;
export const MAX_ORDER_NOTE = 500;
// Per line in the basket (one product in one size)
export const MAX_QUANTITY = 10;
// Lines in one basket
export const MAX_BASKET_LINES = 20;
// Stripe won't take a card payment under 30p
export const MIN_PRICE_PENCE = 30;
export const MAX_PRICE_PENCE = 100000;

// What happens to an order after it's paid - changed by admins on the
// Orders page, and shown to the member under "Your orders"
export const FULFILMENT = [
  { value: "new", label: "New", member: "Order received" },
  {
    value: "ordered",
    label: "Ordered from supplier",
    member: "Being made",
  },
  {
    value: "delivered",
    label: "Delivered",
    member: "Delivered to your choir",
  },
  { value: "cancelled", label: "Cancelled / refunded", member: "Cancelled" },
] as const;
export type Fulfilment = (typeof FULFILMENT)[number]["value"];
export const isFulfilment = (value: unknown): value is Fulfilment =>
  FULFILMENT.some((f) => f.value === value);
export const fulfilmentLabel = (value: Fulfilment, forMember = false) => {
  const found = FULFILMENT.find((f) => f.value === value);
  if (!found) return "";
  return forMember ? found.member : found.label;
};

// Product photos: uploaded by admins straight to storage (R2)
const MB = 1024 * 1024;
export const IMAGE_RULES = {
  types: ["image/jpeg", "image/png", "image/webp"],
  extensions: ".jpg,.jpeg,.png,.webp",
  maxBytes: 8 * MB,
};

// Why a photo can't be uploaded, or null if it's fine
export function imageUploadProblem(contentType: string, size: number) {
  if (!IMAGE_RULES.types.includes(contentType)) {
    return "Photos must be JPG, PNG or WebP";
  }
  if (!(size > 0)) return "That file is empty";
  if (size > IMAGE_RULES.maxBytes) {
    return `That photo is too big (max ${IMAGE_RULES.maxBytes / MB} MB)`;
  }
  return null;
}

// Where product photos are kept in storage: shop/<random id>-<file-name>.
// Only keys that look like this are accepted when a product is saved.
export const SHOP_IMAGE_KEY = /^shop\/[a-f0-9]{24}-[a-z0-9.-]{1,90}$/;

// 2500 -> "£25", 2550 -> "£25.50"
export const formatPence = (pence: number) =>
  `£${pence % 100 === 0 ? String(pence / 100) : (pence / 100).toFixed(2)}`;

// A product, as the Shop page and the admin page see it. Photos come with
// a signed link that works for an hour (made fresh on each visit).
export type ShopProductRow = {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  images: { key: string; url: string }[];
  has_sizes: boolean;
  sizes: string[];
  visible: boolean;
  sort_order: number;
  // False until the matching Stripe product/price exists - can't be bought
  // until then (admins see a warning)
  on_stripe: boolean;
};

// One line of an order - copied from the product when the order was made,
// so it stays right if the product is later renamed or repriced
export type ShopOrderItem = {
  product_id: string;
  name: string;
  size: string;
  quantity: number;
  unit_pence: number;
};

export type ShopOrderRow = {
  id: string;
  // Short code to quote, e.g. "A1B2C3"
  reference: string;
  member_name: string;
  member_email: string;
  items: ShopOrderItem[];
  venue: string;
  note: string;
  total_pence: number;
  fulfilment: Fulfilment;
  paid_at: string | null;
};

// The last 6 characters of the order's id, in capitals
export const orderReference = (id: string) => id.slice(-6).toUpperCase();

// --- Checking what admins type for a product ---

export type ProductFields = {
  name: string;
  description: string;
  price_pence: number;
  has_sizes: boolean;
  sizes: string[];
  visible: boolean;
  sort_order: number;
  image_keys: string[];
};

// "25", "25.5", "25.50", "£25.50" -> pence; null if it isn't a price
export function parsePrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .replace(/^£/, "")
    .match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] || "0").padEnd(2, "0"));
}

// A product as sent by the admin page: trimmed and checked. Returns the
// cleaned-up values, or the message to show if something's wrong.
export function checkProduct(body: {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  has_sizes?: unknown;
  sizes?: unknown;
  visible?: unknown;
  sort_order?: unknown;
  image_keys?: unknown;
}): ProductFields | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (!name) return { error: "Please give the product a name" };
  if (name.length > MAX_PRODUCT_NAME) {
    return { error: `The name can be up to ${MAX_PRODUCT_NAME} characters` };
  }
  if (description.length > MAX_PRODUCT_DESCRIPTION) {
    return {
      error: `The description can be up to ${MAX_PRODUCT_DESCRIPTION} characters`,
    };
  }

  const pricePence = parsePrice(body.price);
  if (pricePence === null) {
    return { error: "Please enter the price in pounds, e.g. 25 or 25.50" };
  }
  if (pricePence < MIN_PRICE_PENCE || pricePence > MAX_PRICE_PENCE) {
    return {
      error: `The price must be between ${formatPence(
        MIN_PRICE_PENCE
      )} and ${formatPence(MAX_PRICE_PENCE)}`,
    };
  }

  const hasSizes = body.has_sizes === true;
  let sizes: string[] = [];
  if (hasSizes) {
    if (!Array.isArray(body.sizes)) return { error: "Please list the sizes" };
    sizes = body.sizes
      .filter((size): size is string => typeof size === "string")
      .map((size) => size.trim())
      .filter(Boolean);
    // No repeats (ignoring capitals)
    sizes = sizes.filter(
      (size, i) =>
        sizes.findIndex((s) => s.toLowerCase() === size.toLowerCase()) === i
    );
    if (!sizes.length) return { error: "Please list at least one size" };
    if (sizes.length > MAX_SIZES) {
      return { error: `Up to ${MAX_SIZES} sizes please` };
    }
    if (sizes.some((size) => size.length > MAX_SIZE_LENGTH)) {
      return {
        error: `Each size can be up to ${MAX_SIZE_LENGTH} characters`,
      };
    }
  }

  const imageKeys = Array.isArray(body.image_keys) ? body.image_keys : [];
  if (imageKeys.length > MAX_IMAGES) {
    return { error: `Up to ${MAX_IMAGES} photos please` };
  }
  if (
    imageKeys.some(
      (key) => typeof key !== "string" || !SHOP_IMAGE_KEY.test(key)
    )
  ) {
    return { error: "One of the photos isn't right - please upload it again" };
  }

  const sortOrder = Number(body.sort_order ?? 0);
  return {
    name,
    description,
    price_pence: pricePence,
    has_sizes: hasSizes,
    sizes,
    visible: body.visible !== false,
    sort_order: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
    image_keys: imageKeys as string[],
  };
}

// --- The basket ---

// One line in the basket: a product, in a size if it has sizes
export type BasketLine = { product_id: string; size: string; quantity: number };

// What's needed of a product to price a basket
export type PricedProduct = Pick<
  ShopProductRow,
  "id" | "name" | "price_pence" | "has_sizes" | "sizes" | "visible"
>;

// Prices a basket from the products as they are NOW (never from prices the
// browser sends). Used by the Shop page to show the total, and by the
// server when the member pays. Returns the order lines and total, or the
// message to show if something's wrong (e.g. a product was taken off the
// shop, or a size no longer offered).
export function priceBasket(
  lines: unknown,
  products: PricedProduct[]
): { items: ShopOrderItem[]; total_pence: number } | { error: string } {
  if (!Array.isArray(lines) || !lines.length) {
    return { error: "Your basket is empty" };
  }
  if (lines.length > MAX_BASKET_LINES) {
    return { error: "That's a lot of items - please contact us instead" };
  }
  const items: ShopOrderItem[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines as Partial<Record<keyof BasketLine, unknown>>[]) {
    const product = products.find(
      (p) => typeof line?.product_id === "string" && p.id === line.product_id
    );
    if (!product || !product.visible) {
      return {
        error:
          "Something in your basket isn't available any more - please remove it",
      };
    }
    const size = typeof line.size === "string" ? line.size : "";
    if (product.has_sizes && !product.sizes.includes(size)) {
      return { error: `Please choose a size for the ${product.name}` };
    }
    const { quantity } = line;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return {
        error: `Please choose between 1 and ${MAX_QUANTITY} of each item`,
      };
    }
    // The same thing twice (e.g. added again) - add them together
    const sameSize = product.has_sizes ? size : "";
    const existing = items.find(
      (item) => item.product_id === product.id && item.size === sameSize
    );
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > MAX_QUANTITY) {
        return {
          error: `Please choose between 1 and ${MAX_QUANTITY} of each item`,
        };
      }
    } else {
      items.push({
        product_id: product.id,
        name: product.name,
        size: sameSize,
        quantity,
        unit_pence: product.price_pence,
      });
    }
  }
  return {
    items,
    total_pence: items.reduce(
      (sum, item) => sum + item.unit_pence * item.quantity,
      0
    ),
  };
}

// "Hoodie (M) × 2"
export const describeItem = (
  item: Pick<ShopOrderItem, "name" | "size" | "quantity">
) => `${item.name}${item.size ? ` (${item.size})` : ""} × ${item.quantity}`;
