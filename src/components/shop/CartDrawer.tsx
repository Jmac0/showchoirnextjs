import { faCartShopping, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  // Total number of items, shown on the icon
  itemCount: number;
  // The basket itself (components/shop/Basket.tsx)
  children: React.ReactNode;
};

// The shop's cart: an icon fixed to the top right of the screen (with how
// many items are in it), which slides the basket in from the right over
// the page, like most online shops. Closes with the X, Escape or a click on
// the dimmed page behind.
export function CartDrawer({
  open,
  onOpen,
  onClose,
  itemCount,
  children,
}: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    // Keyboard users land on the close button, and Escape closes
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind scrolling while the cart is open
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open basket (${itemCount} ${
          itemCount === 1 ? "item" : "items"
        })`}
        className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-lightGold text-black shadow-lg transition-transform hover:scale-105"
      >
        <FontAwesomeIcon icon={faCartShopping} size="lg" />
        {itemCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-lightGold bg-black px-1 text-xs font-bold text-lightGold"
          >
            {itemCount}
          </span>
        )}
      </button>

      {/* Dimmed page behind - click to close */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          open ? "opacity-70" : "pointer-events-none opacity-0"
        }`}
      />

      {/* The panel - stays in the page when closed (slid off to the right,
          hidden from screen readers) so the slide can animate */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your basket"
        aria-hidden={!open}
        className={`h-visible-screen fixed right-0 top-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l-2 border-lightGold bg-lightBlack shadow-2xl transition-[transform,visibility] duration-300 ease-in-out ${
          open ? "translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close basket"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-lightGold hover:bg-lightGold/20"
        >
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </button>
        {children}
      </div>
    </>
  );
}
