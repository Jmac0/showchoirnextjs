import Image from "next/image";
import React from "react";

import stageImage from "@/public/glitter-from-sky.png";

import { extractListItemsFromContentful } from "../lib/helpers/extractListItemsFromContent";
import BookTasterFrom from "./forms/BookTasterForm";
import StyledListComponent from "./StyledListComponent";

type ContentWithListType = {
  type: string;
  props: { children: { type: string; props: { children: string } }[] };
}[];

type Props = {
  content: ContentWithListType;
};
export default function MemberBenefits({ content }: Props) {
  // Initialize empty array to hold strings from Contentful

  const memberBenefitsList = extractListItemsFromContentful(content);

  return (
    <section className="flex flex-col items-center">
      <div className="mt-8 flex flex-col px-4 md:px-20 lg:flex-row">
        <Image
          src={stageImage}
          alt="Member imag"
          width={500}
          className="mt-0 rounded-full bg-black ring-2
           ring-lightGold md:-mt-10 md:mr-7 md:self-center"
        />

        <ul className="m-0 h-2/3 list-none justify-evenly text-center md:mb-60 lg:mb-40">
          <h2 className="mt-16 text-4xl">What you get from Show Choir!</h2>
          {/* render a component for each string in the array  */}
          {memberBenefitsList.map((li: string, index: number) => (
            <StyledListComponent key={index} listText={li} />
          ))}
        </ul>
      </div>
      <div className="my-10 w-full md:w-2/3">
        <BookTasterFrom className="lg:!w-full" />
      </div>
    </section>
  );
}
