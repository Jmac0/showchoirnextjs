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
      <Logo color="gold" />
      <main className="z-1 flex w-full flex-col justify-between md:px-10 xl:flex-row xl:px-12">
        {/* TODO make bullets into musical notes  */}
        <section className="mb-8 flex flex-col rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 px-3 pt-1  text-lg md:mr-5  xl:w-6/12">
          {heroText}
        </section>

        <div className=" mb-10 w-full self-center md:w-2/3 xl:w-6/12">
          <BookTasterForm />
        </div>
      </main>
    </section>
  );
}
