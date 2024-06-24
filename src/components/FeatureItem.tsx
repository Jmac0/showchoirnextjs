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
      className="m-1 h-44 w-full rounded-lg border-2 border-lightGold
     px-3 pt-1 md:h-max md:w-6/12"
    >
      <Image
        className="circle-outline h-full "
        width={200}
        height={200}
        alt={imageDescription}
        src={image}
      />
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
