import Image, { StaticImageData } from "next/image";
import React from "react";

import BookTasterForm from "@/src/components/forms/BookTasterForm";
import Logo from "./Logo";

type Props = {
  bgImage: StaticImageData | string;
  logo: StaticImageData | string;
  heroText: string;
};

// displays the main home page image
export function Hero({ bgImage, heroText }: Props) {
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
      {/* hero text block */}
      <Logo />
      <main className="z-1 mt-30 p-2 pl-5 lg:absolute lg:bottom-6 lg:left-16">
        {heroText}
      </main>
      <BookTasterForm />
    </section>
  );
}
