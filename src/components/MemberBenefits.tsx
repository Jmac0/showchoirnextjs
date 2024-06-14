import Image from "next/image";
import React from "react";

import stageImage from "@/public/glitter-from-sky.png";

import BookTasterFrom from "./forms/BookTasterForm";
import StyledListComponent from "./StyledListComponent";

type Props = {
  benefitsList: {
    type: string;
    props: { children: { type: string; props: { children: string } }[] };
  }[];
};

export default function MemberBenefits({ benefitsList }: Props) {
  // Initialize empty array to hold strings from Contentful
  let memberBenefitsStrings: string[] = [];
  if (benefitsList) {
    // find the list object containing the text needed with type "ul"
    const list = benefitsList.find((obj) => obj.type === "ul");
    if (list) {
      const {
        props: { children },
      } = list;

      // extract the individual list items text into an array
      memberBenefitsStrings = children.map(
        (element: { props: { children: string } }) => {
          const {
            props: { children },
          } = element;
          return children;
        }
      );
    }
  }
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

        <ul className="m-0 h-2/3 list-none justify-evenly  text-center ">
          <h2 className="mt-16 text-4xl">What you get from Show Choir!</h2>
          {/* render a component for each string in the array  */}
          {memberBenefitsStrings.map((li: string, index: number) => (
            <StyledListComponent key={index} listText={li} />
          ))}
        </ul>
      </div>
      <div className="my-10 w-full md:w-2/3">
        <BookTasterFrom />
      </div>
    </section>
  );
}
