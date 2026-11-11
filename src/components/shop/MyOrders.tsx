import { format } from "date-fns";
import React from "react";

import {
  describeItem,
  formatPence,
  fulfilmentLabel,
  ShopOrderRow,
} from "@/src/lib/shopShared";

// The member's own kit orders on the Shop page, and how each is getting on
export function MyOrders({ orders }: { orders: ShopOrderRow[] }) {
  if (!orders.length) return null;
  return (
    <section className="flex w-full flex-col gap-3">
      <h2 className="m-0 p-0 text-2xl">Your orders</h2>
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-1 rounded-lg border border-lightGold/60 bg-lightBlack p-4 text-gray-100"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-bold">
              {order.reference}
              {order.paid_at &&
                ` · ${format(new Date(order.paid_at), "d MMM yyyy")}`}
            </span>
            <span className="rounded-full bg-lightGold/20 px-3 text-sm text-lightGold">
              {fulfilmentLabel(order.fulfilment, true)}
            </span>
          </div>
          <span className="text-sm text-gray-300">
            {order.items.map(describeItem).join(", ")}
          </span>
          <span className="text-sm text-gray-300">
            {formatPence(order.total_pence)}
            {order.venue && ` · to ${order.venue}`}
          </span>
        </div>
      ))}
    </section>
  );
}
