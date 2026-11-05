import React from "react";

import styles from "@/src/styles/stage.module.css";

import { FeatureDataType } from "../types/types";
import FeatureItem from "./FeatureItem";

type Props = {
  featureData: FeatureDataType;
};
export default function FeatureBar({ featureData }: Props) {
  return (
    <section className="w-full bg-black px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-12 text-center text-white`}
        >
          It doesn&apos;t stop at{" "}
          <span className={styles.goldText}>rehearsals</span>
        </h2>
        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {featureData.map((element, index) => (
            <FeatureItem
              key={index}
              text={element.text}
              image={element.image}
              imageDescription={element.imageDescription}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
