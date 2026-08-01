import Image, { StaticImageData } from "next/image";
import React from "react";

import BookTasterForm from "@/src/components/forms/BookTasterForm";

import Logo from "./Logo";
import StyledListComponent from "./StyledListComponent";

type Props = {
  bgImage: StaticImageData | string;

  heroListItems: string[];
  heroTextSignature: string;
  heroTextGreeting: string;
};

// displays the main home page image, welcome info & BookTasterForm component
export function Hero({
  bgImage,
  heroListItems,
  heroTextGreeting,
  heroTextSignature,
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
      <main className="z-1 flex flex-col md:px-10 lg:flex-row xl:px-12">
        <section className="text-md mb-8 flex flex-col rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 px-3 pt-1 md:mr-5 xl:w-2/3">
          {heroTextGreeting}
          <ul className="m-0 h-2/3 list-none justify-evenly  text-center ">
            {/* render a component for each string in the array  */}
            {heroListItems.map((li: string, index: number) => (
              <StyledListComponent key={index} listText={li} />
            ))}
          </ul>
          {heroTextSignature}
        </section>

        <BookTasterForm />
      </main>
    </section>
  );
}
