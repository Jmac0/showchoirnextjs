import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import logoBlack from "@/public/logoBlack.png";
import { GooglePlayBadge } from "@/src/components/GooglePlayBadge";

import Hamburger from "./Hamburger";
import LogOutBtn from "./LogOutBtn";

type Props = {
  // False when their membership isn't active (Direct Debit stopped over 14
  // days ago, or Flexi sessions expired) - Announcements, Resources and Shop are
  // hidden then (isMembershipActive in lib/directDebit.ts)
  membershipActive?: boolean;
};

export default function MemberNav({ membershipActive }: Props) {
  // for mobile it should be transparent and all child buttons should be
  // in a column
  const [open, setOpen] = useState(false);
  // for desktop it should be on the left, full height
  useEffect(() => {
    setOpen(false);
  }, []);

  const handleClick = (): void => {
    setOpen(!open);
  };
  return (
    <>
      <Hamburger handleClick={handleClick} open={open} />
      {/* Scrolls when the screen is too short for the whole menu (small
          phones), so the bottom links and the app badge can always be
          reached. h-visible-screen (global.css) = the height actually
          visible on a phone, between its browser bars. Items keep their
          full height rather than squashing. On wider screens it sits beside
          the page but stays put (sticky) while the page scrolls. */}
      <nav
        className={`h-visible-screen z-20 overflow-y-auto ${
          open ? "left-0" : "-left-full"
        } fixed top-0 flex  w-52 flex-col items-center bg-gradient-to-br from-yellow-200 to-yellow-500 pt-20 transition-all duration-300 ease-in-out md:sticky md:left-0 md:pt-2 [&>*]:shrink-0`}
      >
        <div className="hidden md:block">
          <Link href="/">
            <Image alt="Show Choir" width={110} height={60} src={logoBlack} />
          </Link>
        </div>

        {/* Active members only */}
        {membershipActive && (
          <>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading 
        shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/dashboard?component=notifications"
            >
              Announcements
            </Link>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/resources"
            >
              Resources
            </Link>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/shop"
            >
              Shop
            </Link>
          </>
        )}
        <Link
          onClick={handleClick}
          className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
          href="/members/dashboard?component=account"
        >
          Account
        </Link>
        <Link
          onClick={handleClick}
          className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
          href="/members/dashboard?component=card"
        >
          Membership Card
        </Link>
        <Link
          onClick={handleClick}
          className="flex h-24 w-full flex-col items-center justify-center  font-heading
          shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
          href="/"
        >
          Home
        </Link>

        <LogOutBtn />

        {/* The app, at the bottom of the menu (every member, active or not:
            the app has their card and account too) */}
        <GooglePlayBadge className="mb-4 mt-auto pt-4" />
      </nav>
      {/* Overlay to dim site when menu is open */}
      <button
        type="button"
        aria-label="button"
        onClick={handleClick}
        className={`hamburger-overlay fixed z-[1] h-screen w-screen  bg-black md:hidden ${
          open ? "opacity-70" : " invisible opacity-0"
        } transition-all duration-500 `}
      />
    </>
  );
}

MemberNav.defaultProps = {
  membershipActive: true,
};
