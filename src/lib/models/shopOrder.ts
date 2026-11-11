import mongoose from "mongoose";

import type { Fulfilment, ShopOrderItem } from "@/src/lib/shopShared";

// A members' kit shop order. Saved as "pending" when the member goes to
// Stripe to pay, and marked "paid" when Stripe says the payment went
// through (api/stripe/webhooks.ts). Pending ones never paid for are removed
// by the daily job after a couple of days.
export type ShopOrderType = {
  member_id: mongoose.Types.ObjectId;
  // Copied at order time, so the order still says who it was for if the
  // member changes their details or leaves
  member: { first_name: string; last_name: string; email: string };
  items: (Omit<ShopOrderItem, "product_id"> & {
    product_id: mongoose.Types.ObjectId;
  })[];
  // The choir (rehearsal venue) it's delivered to, e.g. "Banstead"
  venue: string;
  note: string;
  total_pence: number;
  status: "pending" | "paid";
  fulfilment: Fulfilment;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  // What Stripe actually took (normally the same as total_pence)
  amount_paid_pence?: number;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
};

const ShopOrderSchema = new mongoose.Schema<ShopOrderType>(
  {
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Members",
      required: true,
    },
    member: { first_name: String, last_name: String, email: String },
    items: [
      {
        _id: false,
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ShopProducts",
        },
        name: String,
        size: { type: String, default: "" },
        quantity: Number,
        unit_pence: Number,
      },
    ],
    venue: { type: String, default: "" },
    note: { type: String, default: "" },
    total_pence: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    fulfilment: {
      type: String,
      enum: ["new", "ordered", "delivered", "cancelled"],
      default: "new",
    },
    stripe_session_id: String,
    stripe_payment_intent: String,
    amount_paid_pence: Number,
    paid_at: Date,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
// The Orders page (paid, newest first) and a member's own orders
ShopOrderSchema.index({ status: 1, paid_at: -1 });
ShopOrderSchema.index({ member_id: 1, status: 1 });
// One payment can only ever pay for one order
ShopOrderSchema.index(
  { stripe_payment_intent: 1 },
  { unique: true, sparse: true }
);

export default (mongoose.models.ShopOrders as mongoose.Model<ShopOrderType>) ||
  mongoose.model<ShopOrderType>("ShopOrders", ShopOrderSchema);
