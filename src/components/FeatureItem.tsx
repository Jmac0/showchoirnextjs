import Image from "next/image";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown/lib/ast-to-react";

import styles from "@/src/styles/stage.module.css";

type Props = {
  text: string;
  image: string;
  imageDescription: string;
};

// How the words typed into Contentful are displayed on the cards: the heading
// in poster lettering, and any link as a button
const markdownComponents: Components = {
  h3: function CardHeading({ children }) {
    return (
      <h3 className={`${styles.display} mb-3 text-4xl text-lightGold`}>
        {children}
      </h3>
    );
  },
  p: function CardText({ children }) {
    return <p className="m-0 text-lg text-gray-100">{children}</p>;
  },
  a: function CardLink({ children, href }) {
    return (
      <a
        href={href}
        className="mt-4 inline-block rounded-full bg-lightGold px-5 py-2 font-bold text-black hover:bg-yellow-100"
      >
        {children}
      </a>
    );
  },
};

// A card with a round picture and words from Contentful
export default function FeatureItem({ text, image, imageDescription }: Props) {
  return (
    <article className="flex flex-col items-center rounded-3xl border-2 border-lightGold bg-lightBlack p-7 text-center transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]">
      <Image
        className="mb-5 h-44 w-44 object-contain"
        width={220}
        height={220}
        alt={imageDescription}
        src={image}
      />
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </article>
  );
}
