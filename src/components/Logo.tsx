import Image from "next/image";
import React from "react";

import logo from "@/public/logo.png";

export default function Logo() {
  return (
    <>
      <Image
        className="h-22 absolute right-3 m-3 w-24  "
        alt="show choir logo"
        width={100}
        height={100}
        src={logo}
      />
      {/* <Image
        className="absolute right-3 m-5 h-28 w-28  xl:block"
        alt="show choir logo"
        width={100}
        height={100}
        src={logo}
      /> */}
      {/* <Image
        className="h- absolute right-3 m-3 hidden w-36 md:block xl:hidden "
        alt="logo"
        width={150}
        height={150}
        src={logo}
      /> */}
    </>
  );
}
