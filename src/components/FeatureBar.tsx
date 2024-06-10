import React from "react";

import { FeatureDataType } from "../types/types";
import FeatureItem from "./FeatureItem";

type Props = {
  featureData: FeatureDataType;
};
export default function FeatureBar({ featureData }: Props) {
  return (
    <div className="mb-9  mt-6 flex max-h-max w-full flex-col items-center rounded-lg  px-1 py-1 md:flex-row">
      {featureData.map((element, index) => (
        <FeatureItem
          key={index}
          text={element.text}
          image={element.image}
          imageDescription={element.imageDescription}
        />
      ))}
    </div>
  );
}
