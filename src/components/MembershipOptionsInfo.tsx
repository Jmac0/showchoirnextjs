import Link from "next/link";
import React from "react";
import ReactMarkdown from "react-markdown";

import styles from "../styles/stage.module.css";

type Props = {
  badge: string;
  markdown: string;
  navigateTo: string;
  buttonText: string;
};

type MarkdownPartProps = {
  // eslint-disable-next-line react/require-default-props
  children?: React.ReactNode;
};

// The words come from Contentful as markdown, so they can't be given classes
// directly. These say how each kind of text should look in the card.
const markdownParts = {
  h1: ({ children }: MarkdownPartProps) => (
    <h1 className={`${styles.display} ${styles.goldText} text-6xl`}>
      {children}
    </h1>
  ),
  // Any heading with a price goes on the gold ticket, like the rehearsal time
  // on a venue card. Checking for the £ means prices can be changed in
  // Contentful without touching this code.
  h2: ({ children }: MarkdownPartProps) =>
    String(children).includes("£") ? (
      <div className={`${styles.ticket} my-5 px-6 py-1`}>
        <div className="border-y-2 border-dashed border-black/40 py-2">
          <h2 className={`${styles.display} text-3xl text-black`}>
            {children}
          </h2>
        </div>
      </div>
    ) : (
      <h2 className={`${styles.display} mb-2 mt-6 text-2xl text-white`}>
        {children}
      </h2>
    ),
  p: ({ children }: MarkdownPartProps) => (
    <p className="mt-2 text-lg text-gray-200">{children}</p>
  ),
  // mx-auto and w-fit keep the list in the middle of the card, with its lines
  // starting level so the bullets are easy to read
  ul: ({ children }: MarkdownPartProps) => (
    <ul className="mx-auto mb-0 mt-4 block w-fit list-outside pl-5 text-left">
      {children}
    </ul>
  ),
  li: ({ children }: MarkdownPartProps) => (
    <li className="mt-2 text-gray-200 marker:text-lightGold">{children}</li>
  ),
};

// One way of joining on the Join page, in the style of the venue cards: a gold
// edge, poster headings and the price on a gold ticket, with a badge tucked
// into the top left corner
export const MembershipOptionInfo = ({
  badge,
  markdown,
  navigateTo,
  buttonText,
}: Props) => (
  <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-lightGold bg-lightBlack px-6 pb-8 pt-14 text-center transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]">
    <p className="absolute left-0 top-0 m-0 rounded-br-2xl bg-lightGold px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-black">
      {badge}
    </p>

    <ReactMarkdown components={markdownParts}>{markdown}</ReactMarkdown>

    <div className="mt-auto pt-8">
      <Link
        className="inline-block rounded-full bg-lightGold px-6 py-3 font-bold uppercase tracking-wide text-black transition hover:scale-105 hover:bg-yellow-100"
        href={navigateTo}
      >
        {buttonText}
      </Link>
    </div>
  </article>
);
