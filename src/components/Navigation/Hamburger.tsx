import React from "react";

type Props = {
  handleClick: () => void;
  open: boolean;
};
export default function Hamburger({ handleClick, open }: Props) {
  return (
    <button
      data-testid="hamburger-icon"
      type="button"
      onClick={handleClick}
      className={`absolute top-2 z-40 m-4 flex h-12 w-12 flex-col content-center items-center justify-between
        md:hidden
        `}
    >
      <div
        className={`mb-1 mt-3 h-1 w-8 origin-left rounded-full bg-gray-50 ${
          open ? "top-0 w-2/3 rotate-45  bg-lightBlack" : "rotate-0"
        } transition-all duration-300
          `}
      />
      <div
        className={`h-1 w-8 origin-left rounded-full bg-gray-50 ${
          open && "hidden"
        } transition-all duration-300
          `}
      />
      <div
        className={`mb-3 mt-1 h-1 w-8 origin-left rounded-full bg-gray-50 ${
          open ? "mb-[9px] w-2/3 -rotate-45 bg-lightBlack" : "rotate-0"
        } transition-all duration-300
          `}
      />
    </button>
  );
}
