import React from "react";
import BookTasterFrom from "./BookTasterForm";

type Props = {
  isBookingOpen: boolean;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
// popup component to show or hide BookTasterForm on button click
export default function BookTasterPopUpForm({
  isBookingOpen,
  setIsBookingOpen,
}: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsBookingOpen(true)}
        className="flex h-9 max-w-md content-center items-center justify-center rounded-md border-2 border-lightGold
       bg-lightGold px-10 text-black transition-shadow hover:shadow-[0_0_12px_2px_rgba(222,204,120,0.8)]"
      >
        Book Your Free Taster
      </button>{" "}
      {isBookingOpen && (
        <div
          role="presentation"
          onClick={() => setIsBookingOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl"
          >
            <button
              type="button"
              onClick={() => setIsBookingOpen(false)}
              aria-label="Close booking form"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-lightGold bg-black text-white hover:bg-lightGold hover:text-black"
            >
              &times;
            </button>
            <BookTasterFrom className="lg:!w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
