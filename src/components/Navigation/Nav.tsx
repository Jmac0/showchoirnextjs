import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import type { PageItem } from "@/src/types/types";

type Props = {
  pathData?: PageItem[];
};

export function Nav({ pathData = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Spread props to avoid read only error
  const paths = [...pathData];
  // Sort order of menu items by order property
  const sortedItems = paths.sort((a: PageItem, b: PageItem) =>
    a.order < b.order ? -1 : 1
  );

  useEffect(() => {
    setOpen(false);
  }, [router]);

  const handleClick = (): void => {
    setOpen(!open);
  };
  const desktopMenuItems = sortedItems.map(
    (item: { slug: string; displayText: string }) => (
      <Link
        key={item.slug}
        href={item.slug}
        className={`${item.displayText.toLowerCase()}-desktop mb-10 px-3 font-heading text-2xl text-white hover:text-gray-600 md:mb-0`}
      >
        {item.displayText}
      </Link>
    )
  );
  const mobileMenuItems = sortedItems.map(
    (item: { slug: string; displayText: string }) => (
      <Link
        key={item.slug}
        href={item.slug}
        className={`${item.displayText.toLowerCase()}-mobile mb-10 px-3 font-heading text-3xl text-lightBlack hover:text-gray-600 md:mb-0`}
      >
        {item.displayText}
      </Link>
    )
  );

  return (
    <>
      {/* hamburger */}
      <button
        data-testid="hamburger-icon"
        type="button"
        onClick={handleClick}
        className={`z-40 m-4 flex h-12 w-12 flex-col content-center items-center justify-between
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
      {/* draw */}
      <nav
        className={`absolute z-20 ${
          open ? "left-0" : "-left-full"
        } z-10 flex h-full w-2/4 flex-col bg-gold bg-gradient-to-b from-amber-300 to-gold pl-16 pt-28 transition-all duration-300 ease-in-out md:hidden`}
      >
        <Link
          href="/"
          className="home-mobile mb-10 px-3 font-heading text-3xl text-lightBlack hover:text-gray-600 "
        >
          Home
        </Link>

        {mobileMenuItems}
      </nav>
      {/* draw open overlay */}
      <button
        type="button"
        aria-label="button"
        onClick={handleClick}
        className={`hamburger-overlay fixed z-[1] h-screen w-screen  bg-black  md:hidden ${
          open ? "opacity-70" : " invisible opacity-0"
        } transition-all duration-500 `}
      />

      {/* desktop nav container */}
      <nav
        data-testid="desktop-nav"
        className="absolute hidden h-16 w-full flex-row items-center justify-start bg-transparent pl-16 md:z-30 md:flex md:h-28  md:justify-start"
      >
        <Link
          href="/"
          className="home-desktop hidden px-3 font-heading text-2xl  text-white hover:text-gray-600 md:inline-block"
        >
          Home
        </Link>

        {desktopMenuItems}
      </nav>
    </>
  );
}

Nav.defaultProps = {
  pathData: [],
};
