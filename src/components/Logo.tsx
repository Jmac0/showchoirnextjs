import Image from "next/image";
import React from "react";

import logo from "@/public/logo.png";
import logoBlack from "@/public/logoBlack.png";

type Props = {
  color: string;
};

export default function Logo({ color = "gold" }: Props) {
  return (
    <div>
      {color === "gold" ? (
        <Image
          className="h-22 absolute right-3 top-2 m-3 w-24  "
          alt="show choir logo"
          width={100}
          height={100}
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
