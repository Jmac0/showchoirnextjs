import Image from "next/image";
import React from "react";

import logo from "@/public/logo.png";
import logoBlack from "@/public/logoBlack.png";

type Props = {
  color: string;
};

export default function Logo({ color = "gold" }: Props) {
  return (
    <div className="mb-20 ">
      {color === "gold" ? (
        <Image
          className="absolute right-3 top-2 z-50 m-3 h-24 w-28 md:right-10 md:h-32 md:w-36  "
          alt="show choir logo"
          width={200}
          height={200}
          src={logo}
        />
      ) : (
        <Image
          className="h-22 absolute right-3 m-3 w-24  "
          alt="show choir logo"
          width={100}
          height={100}
          src={logoBlack}
        />
      )}
    </div>
  );
}
