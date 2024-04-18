import Image from "next/image";
import React from "react";

type Props = {
  text: string;
  image: string;
  imageDescription: string;
};
export default function FeatureItem({ text, image, imageDescription }: Props) {
  return (
    <div className="mx-1 my-1 h-52 w-full rounded-lg border-x-2 border-solid border-black bg-lightBlack p-2 md:w-1/3">
      <Image
        className="circle-outline"
        width={200}
        height={200}
        alt={imageDescription}
        src={image}
      />
      <p className="">{text}</p>
    </div>
  );
}
