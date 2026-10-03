import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import logoBlack from "@/public/logoBlack.png";

import Hamburger from "./Hamburger";
import LogOutBtn from "./LogOutBtn";

type Props = {
  // False when their membership isn't active (Direct Debit stopped over 14
  // days ago, or Flexi sessions expired) - Notifications and Resources are
  // hidden then (isMembershipActive in lib/directDebit.ts)
  membershipActive?: boolean;
};

export default function MemberNav({ membershipActive }: Props) {
  // for mobile it should be transparent and all child buttons should be
  // in a column
  const [open, setOpen] = useState(false);
  // The admin links are only shown to admins (the page itself also
  // checks, on the server)
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
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
      <nav
        className={`z-20 h-screen   ${
          open ? "left-0" : "-left-full"
        } fixed top-0 flex  w-52 flex-col items-center bg-gradient-to-br from-yellow-200 to-yellow-500 pt-20 transition-all duration-300 ease-in-out md:static md:left-0 md:pt-2`}
      >
        <div className="hidden md:block">
          <Link href="/">
            <Image alt="logo" width={110} height={60} src={logoBlack} />
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
              Notifications
            </Link>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/resources"
            >
              Resources
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
        {/* Admins only - managing the Music & Lyrics, and inviting
            existing Direct Debit members */}
        {isAdmin && (
          <>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/music-admin"
            >
              Music admin
            </Link>
            <Link
              onClick={handleClick}
              className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
              href="/members/dd-members"
            >
              DD members
            </Link>
          </>
        )}
        <Link
          onClick={handleClick}
          className="flex h-24 w-full flex-col items-center justify-center  font-heading
          shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
          href="/"
        >
          Home
        </Link>

        <LogOutBtn />
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
