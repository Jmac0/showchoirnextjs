import Image from "next/image";
import React from "react";

import logo from "@/public/logo.png";

export default function Logo() {
  return (
    <>
      <Image
        className="absolute right-3 m-3 h-24 w-24 md:hidden "
        alt="logo"
        width={100}
        height={100}
        src={logo}
      />
      <Image
        className="absolute right-3 m-5 hidden h-48 w-48  xl:block"
        alt="show choir logo"
        width={200}
        height={200}
        src={logo}
      />
      <Image
        className="absolute right-3 m-3 hidden h-36 w-36 md:block xl:hidden "
        alt="logo"
        width={150}
        height={150}
        src={logo}
      />
    </>
  );
}
