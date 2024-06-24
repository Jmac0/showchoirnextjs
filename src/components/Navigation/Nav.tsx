import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import Hamburger from "@/src/components/Navigation/Hamburger";
import type { PageItemType } from "@/src/types/types";

export function Nav({ pathData = [] }: PageItemType) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Spread props to avoid read-only error
  const paths = [...pathData];
  // Sort order of menu items by order property
  const sortedItems = paths.sort((a, b) => (a.order < b.order ? -1 : 1));

  useEffect(() => {
    setOpen(false);
  }, [router]);

  useEffect(() => {
    // Stop page from scrolling when menu draw is open
    const { body } = document;
    if (open) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }
    // Clean up the effect when the component is unmounted
    return () => {
      body.style.overflow = "";
    };
  }, [open]);

  const handleClick = (): void => {
    setOpen(!open);
  };

  const desktopMenuItems = sortedItems.map(
    (item: { slug: string; displayText: string }) => (
      <Link
        key={item.slug}
        href={`/${
          item.displayText === "Login" && session
            ? "members/dashboard"
            : item.slug
        }`}
        className={`${item.displayText.toLowerCase()}-desktop mb-10 px-3 
        font-heading text-2xl text-white hover:text-amber-200 hover:underline md:mb-0`}
      >
        {item.displayText === "Login" && session ? "Members" : item.displayText}
      </Link>
    )
  );

  const mobileMenuItems = sortedItems.map(
    (item: { slug: string; displayText: string }) => (
      <Link
        key={item.slug}
        href={`/${
          item.displayText === "Login" && session
            ? "members/dashboard"
            : item.slug
        }`}
        className={`${item.displayText.toLowerCase()}-mobile mb-10 px-3 
        font-heading text-3xl text-lightBlack hover:text-gray-600 md:mb-0`}
      >
        {item.displayText === "Login" && session ? "Members" : item.displayText}
      </Link>
    )
  );

  return (
    <>
      <Hamburger handleClick={handleClick} open={open} />
      {/* drawer */}
      <nav
        className={`absolute z-20 ${
          open ? "left-0 " : "-left-full"
        } flex h-full w-2/3 flex-col bg-gold bg-gradient-to-b from-amber-300 
        to-gold pl-4 pt-28 transition-all duration-300 ease-in-out md:hidden`}
      >
        <Link
          href="/"
          className="home-mobile mb-10 px-3 font-heading text-3xl text-lightBlack hover:text-gray-600"
        >
          Home
        </Link>

        {mobileMenuItems}
      </nav>
      {/* drawer open overlay */}
      <button
        type="button"
        aria-label="button"
        onClick={handleClick}
        className={`hamburger-overlay fixed z-[1] h-screen w-screen bg-black md:hidden ${
          open ? "overflow-hidden opacity-70" : "invisible opacity-0"
        } transition-all duration-500`}
      />

      {/* desktop nav container */}
      <nav
        data-testid="desktop-nav"
        className="absolute hidden h-16 w-full flex-row items-center justify-start
        bg-transparent pl-8 md:z-30 md:flex md:h-28 md:justify-start"
      >
        <Link
          href="/"
          className="home-desktop hidden px-3 font-heading text-2xl text-white hover:text-gray-600 md:inline-block"
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
