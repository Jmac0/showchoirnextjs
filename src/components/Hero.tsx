import Image, { StaticImageData } from "next/image";
import React from "react";

import BookTasterForm from "@/src/components/forms/BookTasterForm";

type Props = {
  bgImage: StaticImageData | string;
  logo: StaticImageData | string;
  heroText: string;
};

// displays the main home page image
export function Hero({ bgImage, logo, heroText }: Props) {
  return (
    <section className="absolute flex flex-col bg-black  lg:flex-row">
      {/* hero image  */}
      <div className="w-full  lg:w-3/4">
        <Image
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          alt="image of choir signing"
          src={bgImage}
        />
      </div>
      {/*  Logo  */}
      <div className="absolute right-3 md:hidden ">
        <Image priority alt="logo" width={100} height={100} src={logo} />;
      </div>
      <div className="absolute right-3 hidden  md:block lg:hidden ">
        <Image
          priority
          alt="show choir logo"
          width={200}
          height={200}
          src={logo}
        />
        ;
      </div>
      <div className="absolute hidden md:right-20  md:top-20 lg:block ">
        <Image alt="logo" width={270} height={270} src={logo} />;
      </div>

      {/* hero text block */}
      <div className="z-1 -mt-24 p-2 pl-5 md:bottom-0  lg:absolute lg:bottom-6 lg:left-16 lg:h-72 ">
        {heroText}
      </div>

      <BookTasterForm />
    </section>
  );
}
