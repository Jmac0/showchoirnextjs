import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import {
  BasketLine,
  formatPence,
  MAX_ORDER_NOTE,
  MAX_QUANTITY,
  priceBasket,
  ShopProductRow,
} from "@/src/lib/shopShared";

type Props = {
  lines: BasketLine[];
  products: ShopProductRow[];
  venues: string[];
  // The member's own choir, chosen to start with
  homeChoir: string;
  onQuantity: (line: BasketLine, quantity: number) => void;
  onRemove: (line: BasketLine) => void;
};

// The member's basket (inside the slide-in cart, CartDrawer.tsx): what's in it, which choir to bring it to, an
// optional note, and "Pay" - off to Stripe's checkout page
export function Basket({
  lines,
  products,
  venues,
  homeChoir,
  onQuantity,
  onRemove,
}: Props) {
  const [venue, setVenue] = useState(
    venues.includes(homeChoir) ? homeChoir : ""
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priced = lines.length ? priceBasket(lines, products) : null;

  const pay = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/shop/checkout", {
        lines,
        venue,
        note,
      });
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Couldn't start the payment - please try again"
      );
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={pay}
      className="show-form flex w-full flex-col gap-3 p-5 pt-6 text-gray-100"
    >
      <h2 className="m-0 p-0 text-2xl">Your basket</h2>
      {!lines.length && (
        <p className="m-0 text-sm text-gray-300">
          Nothing in it yet - choose your kit and press &ldquo;Add to
          basket&rdquo;.
        </p>
      )}

      {lines.map((line) => {
        const product = products.find((p) => p.id === line.product_id);
        if (!product) return null;
        return (
          <div
            key={`${line.product_id}-${line.size}`}
            className="flex items-center gap-2 border-b border-lightGold/30 pb-2"
          >
            <div className="flex flex-1 flex-col">
              <span className="font-bold">{product.name}</span>
              {line.size && (
                <span className="text-sm text-gray-300">Size {line.size}</span>
              )}
            </div>
            <select
              aria-label={`How many ${product.name}`}
              value={line.quantity}
              onChange={(e) => onQuantity(line, Number(e.target.value))}
              className="rounded border-2 border-lightGold/60 bg-white px-1 py-1 text-black"
            >
              {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                )
              )}
            </select>
            <span className="w-16 text-right">
              {formatPence(product.price_pence * line.quantity)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(line)}
              className="rounded-md p-2 text-red-400 hover:bg-red-400/20"
              aria-label={`Remove ${product.name}`}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        );
      })}

      {priced && "total_pence" in priced && (
        <>
          <p className="m-0 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-lightGold">
              {formatPence(priced.total_pence)}
            </span>
          </p>
          <label htmlFor="shopVenue" className="flex flex-col gap-1">
            Bring it to my choir at
            <select
              id="shopVenue"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            >
              <option value="">Choose a choir</option>
              {venues.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="shopNote" className="flex flex-col gap-1">
            Note (optional)
            <textarea
              id="shopNote"
              rows={2}
              maxLength={MAX_ORDER_NOTE}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything we should know?"
            />
          </label>
          <p className="m-0 text-xs text-gray-400">
            Everything is made to order, so it can take a few weeks. No postage
            - we bring it to your choir.
          </p>
        </>
      )}
      {priced && "error" in priced && (
        <p className="m-0 text-sm text-red-400">{priced.error}</p>
      )}
      {error && (
        <p role="alert" className="m-0 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      {lines.length > 0 && (
        <LoadingButton
          text="Pay now"
          loading={loading}
          disabled={!priced || "error" in priced || !venue}
        />
      )}
    </form>
  );
}
