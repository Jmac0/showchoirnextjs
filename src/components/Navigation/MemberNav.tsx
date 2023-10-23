import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import logoBlack from "@/public/logo-black.png";

import Hamburger from "./Hamburger";
import LogOutBtn from "./LogOutBtn";
import MemberBtn from "./MemberBtn";

type MemberNavPropsType = {
  setComponent: (componentName: string) => void;
};

export default function MemberNav({ setComponent }: MemberNavPropsType) {
  // for mobile it should be transparent and all child buttons should be
  // in a column
  const [open, setOpen] = useState(true);
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
        className={`z-20  ${
          open ? "left-0" : "-left-full"
        } absolute flex h-screen w-52 flex-col items-center bg-gradient-to-br from-yellow-200 to-yellow-500 pt-20 transition-all duration-300 ease-in-out md:static md:left-0 md:pt-2`}
      >
        <div className="hidden md:block">
          <Link href="/">
            <Image alt="logo" width={110} height={60} src={logoBlack} />
          </Link>
        </div>
        <MemberBtn
          handleClick={handleClick}
          setActiveComponent={setComponent}
          text="Lyrics"
        />
        <MemberBtn
          handleClick={handleClick}
          setActiveComponent={setComponent}
          text="Notifications"
        />
        <MemberBtn
          handleClick={handleClick}
          setActiveComponent={setComponent}
          text="Account"
        />
        <MemberBtn
          handleClick={handleClick}
          setActiveComponent={setComponent}
          text="Membership Card"
        />

        <Link
          className="flex h-24 w-full flex-col items-center justify-center font-heading 
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
