import Image, { StaticImageData } from "next/image";
import React from "react";

import BookTasterForm from "@/src/components/forms/BookTasterForm";

import Logo from "./Logo";

type Props = {
  bgImage: StaticImageData | string;
  heroText: string;
};

// displays the main home page image
export function Hero({ bgImage, heroText }: Props) {
  return (
    <section className="flex flex-col overflow-hidden bg-black">
      {/* hero image  */}
      <div className="lg:-mb-2/3  flex w-full overflow-hidden md:-mb-80 xl:w-2/3">
        <Image
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          alt="image of choir signing"
          src={bgImage}
        />
      </div>
      {/* hero text block */}
      <Logo />
      <main className="z-1 flex w-full flex-col justify-between md:flex-row md:px-10 xl:px-12">
        <section className="flex flex-col px-2 xl:w-1/3">{heroText}</section>

        <div className=" xl:w-5/12">
          <BookTasterForm />
        </div>
      </main>
    </section>
  );
}
