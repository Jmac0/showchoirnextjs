import Image from "next/image";
import React from "react";

import logo from "@/public/logo.png";

export default function Logo() {
  return (
    <>
      <Image
        className="absolute right-3 m-3 md:hidden "
        priority
        alt="logo"
        width={100}
        height={100}
        src={logo}
      />
      <Image
        className="absolute right-3 m-5 hidden  xl:block"
        priority
        alt="show choir logo"
        width={200}
        height={200}
        src={logo}
      />
      <Image
        className="absolute right-3 m-3 hidden md:block xl:hidden "
        alt="logo"
        width={150}
        height={150}
        src={logo}
      />
    </>
  );
}
