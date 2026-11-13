import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import React, { useState } from "react";

import {
  formatPence,
  fulfilmentLabel,
  ShopOrderRow,
} from "@/src/lib/shopShared";

// How many orders to show at a time
const ORDERS_PAGE = 5;

// The member's own kit orders on the Shop page, and how each is getting on.
// Folded away until clicked (open straight after paying, so the new order
// shows), newest 5 first, then 5 more per "Load more" - same as the app's
// Shop tab. Leaving the page puts it back to 5.
export function MyOrders({
  orders,
  startOpen,
}: {
  orders: ShopOrderRow[];
  // Open to begin with (just paid)
  startOpen: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [shown, setShown] = useState(ORDERS_PAGE);

  if (!orders.length) return null;
  return (
    // One dark grey panel holding the header and the orders, so the orders
    // sit inside "Your orders" rather than under it
    <section className="flex w-full flex-col overflow-hidden rounded-lg border border-lightGold/60 bg-[rgb(58,59,64)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="my-orders-list"
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
      >
        <span className="text-xl font-bold text-lightGold">
          Your orders ({orders.length})
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-lightGold transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div id="my-orders-list" className="flex flex-col gap-3 px-4 pb-4">
          {orders.slice(0, shown).map((order) => (
            <div
              key={order.id}
              className="flex flex-col rounded-lg border border-lightGold/60 bg-lightBlack p-4 text-gray-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  Order {order.reference}
                </span>
                <span className="rounded-full bg-lightGold/20 px-3 py-1 text-xs font-bold text-lightGold">
                  {fulfilmentLabel(order.fulfilment, true)}
                </span>
              </div>
              {order.paid_at && (
                <span className="mt-1 text-sm text-gray-400">
                  {format(new Date(order.paid_at), "d MMMM yyyy")}
                  {order.venue && ` · to ${order.venue}`}
                </span>
              )}
              {order.items.map((item) => (
                <span
                  key={`${item.product_id}-${item.size}`}
                  className="mt-1 text-gray-200"
                >
                  {item.quantity} × {item.name}
                  {item.size && ` (${item.size})`}
                </span>
              ))}
              <span className="mt-2 font-bold text-lightGold">
                {formatPence(order.total_pence)}
              </span>
            </div>
          ))}
          {orders.length > shown && (
            <button
              type="button"
              onClick={() => setShown((s) => s + ORDERS_PAGE)}
              className="mt-1 rounded-full border border-lightGold py-3 font-bold text-lightGold transition hover:bg-lightGold/10"
            >
              Load more ({orders.length - shown} older)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
