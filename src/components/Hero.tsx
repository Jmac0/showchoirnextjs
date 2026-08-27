import Image, { StaticImageData } from "next/image";
import React from "react";

import BookTasterForm from "@/src/components/forms/BookTasterForm";
import { VenueType } from "@/src/types/types";

import Logo from "./Logo";
import StyledListComponent from "./StyledListComponent";

type Props = {
  bgImage: StaticImageData | string;

  heroListItems: string[];
  heroTextSignature: string;
  heroTextGreeting: string;
  venues?: VenueType[];
};

// displays the main home page image, welcome info & BookTasterForm component
export function Hero({
  bgImage,
  heroListItems,
  heroTextGreeting,
  heroTextSignature,
  venues = [],
}: Props) {
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
      <main className="z-1 flex items-center md:px-1 lg:flex-row xl:px-12">
        <section className="text-md mb-8 flex w-full min-w-0 flex-col items-center gap-4 rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 px-5 pt-1 md:mr-5 md:flex-row">
          <div className="text-md  w-full md:w-2/3">
            {heroTextGreeting}
            <ul className="m-0  list-none  text-center ">
              {/* render a component for each string in the array  */}
              {heroListItems.map((li: string, index: number) => (
                <StyledListComponent key={index} listText={li} />
              ))}
            </ul>
            <p className="font-bold">I&apos;d love to see you at Show Choir!</p>
            <Image
              src="/signature.png"
              alt="Ange"
              width={200}
              height={313}
              className="mb-3 h-auto w-24 md:ml-60 md:w-32"
            />
          </div>

          <Image
            src="/ange-half-length.png"
            alt="Ange profile pic"
            width={413}
            height={513}
            sizes="(max-width: 768px) 90vw, 33vw"
            className=" h-auto w-11/12 max-w-sm shrink-0 md:w-1/2"
          />
        </section>
        {/* <BookTasterForm className="py-16" venues={venues} /> */}
      </main>
    </section>
  );
}

Hero.defaultProps = {
  venues: [],
};
