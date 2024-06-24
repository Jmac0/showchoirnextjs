import Image from "next/image";
import React from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  text: string;
  image: string;
  imageDescription: string;
};
export default function FeatureItem({ text, image, imageDescription }: Props) {
  return (
    <div
      className="md:h-47 m-1 w-full  items-center rounded-lg border-2 border-lightGold p-4
     md:w-6/12  md:items-start"
    >
      <Image
        className="circle-outline h-full "
        width={200}
        height={200}
        alt={imageDescription}
        src={image}
      />
      <ReactMarkdown className="text-center">{text}</ReactMarkdown>
    </div>
  );
}
