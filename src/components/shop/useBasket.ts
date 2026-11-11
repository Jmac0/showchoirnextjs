import { useCallback, useEffect, useState } from "react";

import { BasketLine, MAX_QUANTITY } from "@/src/lib/shopShared";

// Remembered in this browser, so the basket survives a page reload or a
// cancelled payment. Only product ids, sizes and quantities - prices are
// always worked out from the products.
const BASKET_KEY = "shopBasket";

const save = (lines: BasketLine[]) => {
  try {
    window.localStorage.setItem(BASKET_KEY, JSON.stringify(lines));
  } catch {
    // Storage blocked (e.g. private browsing) - the basket just isn't kept
  }
};

// The member's basket: add, change how many, remove, empty
export function useBasket() {
  const [lines, setLines] = useState<BasketLine[]>([]);

  // Read after the page loads (not available on the server)
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(BASKET_KEY) || "[]");
      if (Array.isArray(saved)) setLines(saved);
    } catch {
      // Nothing saved, or storage blocked
    }
  }, []);

  const update = useCallback((change: (old: BasketLine[]) => BasketLine[]) => {
    setLines((old) => {
      const next = change(old);
      save(next);
      return next;
    });
  }, []);

  const same = (a: BasketLine, b: Pick<BasketLine, "product_id" | "size">) =>
    a.product_id === b.product_id && a.size === b.size;

  return {
    lines,
    // Adds to the line for the same product and size if there is one
    add: (line: BasketLine) =>
      update((old) =>
        old.some((l) => same(l, line))
          ? old.map((l) =>
              same(l, line)
                ? {
                    ...l,
                    quantity: Math.min(
                      MAX_QUANTITY,
                      l.quantity + line.quantity
                    ),
                  }
                : l
            )
          : [...old, line]
      ),
    setQuantity: (line: BasketLine, quantity: number) =>
      update((old) => old.map((l) => (same(l, line) ? { ...l, quantity } : l))),
    remove: (line: BasketLine) =>
      update((old) => old.filter((l) => !same(l, line))),
    clear: () => update(() => []),
    // Drops anything no longer in the shop (or a size no longer offered)
    keepOnly: (isValid: (line: BasketLine) => boolean) =>
      update((old) => (old.every(isValid) ? old : old.filter(isValid))),
  };
}
