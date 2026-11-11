import mongoose from "mongoose";

// A product in the members' kit shop (T-shirt, hoodie, ...). Set up by
// admins on the Shop products page; the matching Stripe product and price
// are created/updated from here (lib/shop.ts) - this is the master copy.
// Everything is made to order, so there are no stock levels.
export type ShopProductType = {
  name: string;
  description: string;
  price_pence: number;
  // Photos in R2 (lib/shopImages.ts), first one is the main photo
  images: { key: string }[];
  // Whether members pick a size, and the sizes they can pick
  has_sizes: boolean;
  sizes: string[];
  // Shown in the shop (hidden ones keep their past orders)
  visible: boolean;
  // Lower numbers first in the shop
  sort_order: number;
  stripe_product_id?: string;
  // The Stripe price used at checkout, and what it charges. Stripe prices
  // can't be changed, so a new price means a new Stripe price.
  stripe_price_id?: string;
  stripe_price_pence?: number;
  created_at: Date;
  updated_at: Date;
};

const ShopProductSchema = new mongoose.Schema<ShopProductType>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price_pence: { type: Number, required: true },
    images: [{ _id: false, key: { type: String, required: true } }],
    has_sizes: { type: Boolean, default: false },
    sizes: { type: [String], default: [] },
    visible: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    stripe_product_id: String,
    stripe_price_id: String,
    stripe_price_pence: Number,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default (mongoose.models
  .ShopProducts as mongoose.Model<ShopProductType>) ||
  mongoose.model<ShopProductType>("ShopProducts", ShopProductSchema);
