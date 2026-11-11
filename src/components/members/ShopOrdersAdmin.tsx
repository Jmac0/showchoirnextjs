import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { format } from "date-fns";
import React, { useState } from "react";

import {
  describeItem,
  formatPence,
  FULFILMENT,
  Fulfilment,
  ShopOrderRow,
} from "@/src/lib/shopShared";

const SELECT = "rounded py-2 pl-2 pr-6 text-base text-black";

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// How many of each product and size are in these orders - what to order
// from the supplier. Cancelled orders aren't counted.
function totals(orders: ShopOrderRow[]) {
  const counts = new Map<string, number>();
  orders
    .filter((order) => order.fulfilment !== "cancelled")
    .forEach((order) =>
      order.items.forEach((item) => {
        const label = `${item.name}${item.size ? ` (${item.size})` : ""}`;
        counts.set(label, (counts.get(label) || 0) + item.quantity);
      })
    );
  return Array.from(counts).sort(([a], [b]) => a.localeCompare(b));
}

// The "Shop orders" admin page's contents: who ordered what, which choir
// it goes to, and how each order is getting on. Paid orders only.
export function ShopOrdersAdmin({
  initialOrders,
  venues,
}: {
  initialOrders: ShopOrderRow[];
  venues: string[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [venue, setVenue] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filters = new URLSearchParams({
    ...(venue ? { venue } : {}),
    ...(fulfilment ? { fulfilment } : {}),
  }).toString();

  const filter = async (newVenue: string, newFulfilment: Fulfilment | "") => {
    setVenue(newVenue);
    setFulfilment(newFulfilment);
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.get("/api/admin/shop/orders", {
        params: {
          ...(newVenue ? { venue: newVenue } : {}),
          ...(newFulfilment ? { fulfilment: newFulfilment } : {}),
        },
      });
      setOrders(data.orders);
    } catch (err) {
      setError(
        errorMessage(err, "Couldn't load the orders - please try again")
      );
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (order: ShopOrderRow, value: Fulfilment) => {
    setError("");
    const before = orders;
    setOrders(
      orders.map((o) => (o.id === order.id ? { ...o, fulfilment: value } : o))
    );
    try {
      await axios.patch(`/api/admin/shop/orders/${order.id}`, {
        fulfilment: value,
      });
    } catch (err) {
      setOrders(before);
      setError(errorMessage(err, "Couldn't change it - please try again"));
    }
  };

  const summary = totals(orders);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 text-gray-100">
      {/* --- Filters and download --- */}
      <div className="flex flex-wrap items-end justify-center gap-3">
        <label className="flex flex-col gap-1 text-sm" htmlFor="ordersVenue">
          Choir
          <select
            id="ordersVenue"
            className={SELECT}
            value={venue}
            disabled={busy}
            onChange={(e) => filter(e.target.value, fulfilment)}
          >
            <option value="">All choirs</option>
            {venues.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="ordersStatus">
          Status
          <select
            id="ordersStatus"
            className={SELECT}
            value={fulfilment}
            disabled={busy}
            onChange={(e) => filter(venue, e.target.value as Fulfilment | "")}
          >
            <option value="">Any status</option>
            {FULFILMENT.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <a
          href={`/api/admin/shop/orders?download=1${
            filters ? `&${filters}` : ""
          }`}
          className="flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black"
        >
          <FontAwesomeIcon icon={faDownload} /> Download spreadsheet
        </a>
      </div>
      {error && (
        <p role="alert" className="m-0 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      {/* --- What to order from the supplier --- */}
      {summary.length > 0 && (
        <div className="rounded-md border-2 border-lightGold bg-lightBlack/90 p-4">
          <h2 className="m-0 mb-2 p-0 text-lg">
            Totals for these orders (not counting cancelled)
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 text-sm md:grid-cols-2">
            {summary.map(([label, count]) => (
              <li key={label}>
                {label}: <b>{count}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- The orders --- */}
      {orders.length === 0 && (
        <p className="text-center text-sm italic">No orders</p>
      )}
      {orders.map((order) => (
        <div
          key={order.id}
          className={`flex flex-col gap-2 rounded-md border-2 border-lightGold bg-lightBlack/90 p-4 md:flex-row md:items-start ${
            order.fulfilment === "cancelled" || order.fulfilment === "delivered"
              ? "opacity-60"
              : ""
          }`}
        >
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-bold">
              {order.member_name}{" "}
              <span className="font-normal text-gray-300">
                &middot; {order.venue || "No choir"} &middot; {order.reference}
              </span>
            </span>
            <span className="text-sm text-gray-300">
              {order.member_email}
              {order.paid_at &&
                ` · paid ${format(new Date(order.paid_at), "d MMM yyyy")}`}{" "}
              &middot; {formatPence(order.total_pence)}
            </span>
            <ul className="m-0 list-disc pl-5 text-sm">
              {order.items.map((item) => (
                <li key={`${item.product_id}-${item.size}`}>
                  {describeItem(item)}
                </li>
              ))}
            </ul>
            {order.note && (
              <p className="m-0 text-sm italic">&ldquo;{order.note}&rdquo;</p>
            )}
          </div>
          <select
            aria-label={`Status of order ${order.reference}`}
            className={SELECT}
            value={order.fulfilment}
            onChange={(e) => changeStatus(order, e.target.value as Fulfilment)}
          >
            {FULFILMENT.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
