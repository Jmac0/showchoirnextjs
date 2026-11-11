/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database, login, storage or Stripe
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("../../lib/models/shopProduct", () => ({
  __esModule: true,
  default: { find: jest.fn(), create: jest.fn() },
}));
jest.mock("../../lib/models/shopOrder", () => ({
  __esModule: true,
  default: { findOneAndUpdate: jest.fn() },
}));
jest.mock("../../lib/music", () => ({
  deleteFiles: jest.fn(),
  safeFileName: (name: string) => name.toLowerCase(),
  signedFileUrl: jest.fn(async (key: string) => `https://signed/${key}`),
  storageEndpointFor: jest.fn(() => "https://r2"),
  uploadedSize: jest.fn().mockResolvedValue(1000),
}));
jest.mock("../../lib/stripe/stripeSetup", () => ({
  stripe: {
    products: { create: jest.fn(), update: jest.fn() },
    prices: { create: jest.fn(), update: jest.fn() },
  },
}));
jest.mock("../../lib/email/sendShopOrderEmails", () => ({
  sendShopOrderEmails: jest.fn(),
}));

/* eslint-disable import/first */
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import ShopOrders from "@/src/lib/models/shopOrder";
import ShopProducts from "@/src/lib/models/shopProduct";
import { uploadedSize } from "@/src/lib/music";
import { csvCell, ordersCsv } from "@/src/lib/shop";
import { ShopOrderRow } from "@/src/lib/shopShared";
import { stripe } from "@/src/lib/stripe/stripeSetup";
import adminShopOrder from "@/src/pages/api/admin/shop/orders/[id]";
import adminShopProducts from "@/src/pages/api/admin/shop/products";
/* eslint-enable import/first */

const KEY = `shop/${"a".repeat(24)}-hoodie.jpg`;

const call = (
  handler: typeof adminShopProducts,
  method: string,
  body?: object,
  params?: Record<string, string>
) =>
  new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    testApiHandler({
      handler,
      params,
      test: async ({ fetch }) => {
        const res = await fetch({
          method,
          headers: { "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

// A newly created product document
const newProduct = () => {
  const doc: Record<string, unknown> = {
    _id: "p1",
    name: "Hoodie",
    description: "",
    price_pence: 3000,
    visible: true,
    images: [{ key: KEY }],
  };
  doc.set = jest.fn((field: string | object, value?: unknown) =>
    Object.assign(doc, typeof field === "string" ? { [field]: value } : field)
  );
  doc.save = jest.fn();
  return doc;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue({ _id: "admin1" });
  (ShopProducts.find as jest.Mock).mockReturnValue({
    sort: jest.fn(() => ({ lean: jest.fn().mockResolvedValue([]) })),
  });
  (stripe.products.create as jest.Mock).mockResolvedValue({ id: "prod_1" });
  (stripe.prices.create as jest.Mock).mockResolvedValue({ id: "price_1" });
});

describe("Shop admin - products", () => {
  it("Should be for admins only", async () => {
    (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Admins only" });
      return null;
    });
    expect((await call(adminShopProducts, "GET")).status).toBe(403);
  });

  it("Should add a product and set it up in Stripe", async () => {
    const doc = newProduct();
    (ShopProducts.create as jest.Mock).mockResolvedValue(doc);
    const res = await call(adminShopProducts, "POST", {
      name: "Hoodie",
      price: "30",
      has_sizes: true,
      sizes: ["S", "M"],
      image_keys: [KEY],
    });
    expect(res.status).toBe(201);
    expect(ShopProducts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Hoodie",
        price_pence: 3000,
        sizes: ["S", "M"],
        images: [{ key: KEY }],
      })
    );
    expect(stripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Hoodie", active: true })
    );
    expect(stripe.prices.create).toHaveBeenCalledWith({
      product: "prod_1",
      currency: "gbp",
      unit_amount: 3000,
    });
    expect(doc).toMatchObject({
      stripe_product_id: "prod_1",
      stripe_price_id: "price_1",
      stripe_price_pence: 3000,
    });
  });

  it("Should turn down a photo that never finished uploading", async () => {
    (uploadedSize as jest.Mock).mockResolvedValueOnce(null);
    const res = await call(adminShopProducts, "POST", {
      name: "Hoodie",
      price: "30",
      image_keys: [KEY],
    });
    expect(res.status).toBe(400);
    expect(ShopProducts.create).not.toHaveBeenCalled();
  });

  it("Should keep the product but say so if Stripe fails", async () => {
    (ShopProducts.create as jest.Mock).mockResolvedValue(newProduct());
    (stripe.products.create as jest.Mock).mockRejectedValue(new Error("down"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await call(adminShopProducts, "POST", {
      name: "Hoodie",
      price: "30",
    });
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/Saved, but Stripe/);
  });
});

describe("Shop admin - orders", () => {
  it("Should change an order's status", async () => {
    (ShopOrders.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: "o" });
    const id = "c".repeat(24);
    const res = await call(
      adminShopOrder,
      "PATCH",
      { fulfilment: "delivered" },
      { id }
    );
    expect(res.status).toBe(200);
    expect(ShopOrders.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: id, status: "paid" },
      { fulfilment: "delivered" }
    );
  });

  it("Should only accept a real status", async () => {
    const res = await call(
      adminShopOrder,
      "PATCH",
      { fulfilment: { $ne: "x" } },
      { id: "c".repeat(24) }
    );
    expect(res.status).toBe(400);
  });

  it("Should make a spreadsheet that's safe to open", () => {
    expect(csvCell('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    const order: ShopOrderRow = {
      id: "c".repeat(24),
      reference: "CCCCCC",
      member_name: "Sam Singer",
      member_email: "sam@example.com",
      items: [
        {
          product_id: "p",
          name: "Hoodie",
          size: "M",
          quantity: 2,
          unit_pence: 3000,
        },
      ],
      venue: "Banstead",
      note: "",
      total_pence: 6000,
      fulfilment: "new",
      paid_at: "2026-11-11T10:00:00.000Z",
    };
    const lines = ordersCsv([order]).split("\r\n");
    expect(lines[0].startsWith("﻿")).toBe(true);
    expect(lines[1]).toBe(
      '"CCCCCC","2026-11-11","Sam Singer","sam@example.com","Banstead","Hoodie","M","2","30.00","New",""'
    );
  });
});
