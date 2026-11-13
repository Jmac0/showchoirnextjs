import React, { useState } from "react";

import {
  BasketLine,
  formatPence,
  MAX_QUANTITY,
  ShopProductRow,
} from "@/src/lib/shopShared";

const SELECT =
  "rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none";

// One product in the members' Shop: photos, price, a size (if it comes in
// sizes), how many, and "Add to basket"
export function ProductCard({
  product,
  onAdd,
}: {
  product: ShopProductRow;
  onAdd: (line: BasketLine) => void;
}) {
  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const needsSize = product.has_sizes && !size;

  const add = () => {
    if (needsSize) return;
    onAdd({
      product_id: product.id,
      size: product.has_sizes ? size : "",
      quantity,
    });
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-lightGold bg-lightBlack transition-shadow hover:shadow-[0_0_20px_rgba(222,204,120,0.35)]">
      {product.images[photo] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[photo].url}
          alt={product.name}
          className="aspect-square w-full bg-black object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-black text-gray-500">
          Photo coming soon
        </div>
      )}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-3 pt-3">
          {product.images.map((image, i) => (
            <button
              key={image.key}
              type="button"
              onClick={() => setPhoto(i)}
              aria-label={`Photo ${i + 1} of ${product.name}`}
              className={`h-12 w-12 overflow-hidden rounded ${
                i === photo ? "ring-2 ring-lightGold" : "opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="m-0 p-0 text-xl">{product.name}</h2>
          <span className="text-lg font-bold text-lightGold">
            {formatPence(product.price_pence)}
          </span>
        </div>
        {product.description && (
          <p className="m-0 whitespace-pre-line text-sm text-gray-300">
            {product.description}
          </p>
        )}

        {/* Sizes as pills - tap one (same as the app) */}
        {product.has_sizes && (
          <div className="mt-auto pt-2">
            <span
              id={`sizes-${product.id}`}
              className="text-xs font-bold uppercase tracking-widest text-lightGold"
            >
              Size
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`sizes-${product.id}`}
              className="mt-2 flex flex-wrap gap-2"
            >
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`min-w-[44px] rounded-full border px-3 py-2 text-sm font-bold transition ${
                    size === s
                      ? "border-lightGold bg-lightGold text-black"
                      : "border-gray-500 text-gray-200 hover:border-lightGold"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={`flex flex-wrap items-center gap-3 pt-2 ${
            product.has_sizes ? "" : "mt-auto"
          }`}
        >
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Qty
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={SELECT}
            >
              {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={needsSize}
          className="mt-2 rounded-full bg-lightGold px-6 py-2 font-bold uppercase tracking-wide text-black transition enabled:hover:bg-yellow-100 disabled:opacity-60"
        >
          {/* eslint-disable-next-line no-nested-ternary */}
          {added ? "Added ✓" : needsSize ? "Choose a size" : "Add to basket"}
        </button>
      </div>
    </div>
  );
}
