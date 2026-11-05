import Image from "next/image";
import React from "react";

import brolliesImage from "@/public/brollies.png";
import stageImage from "@/public/glitter-from-sky.png";
import styles from "@/src/styles/stage.module.css";

import { extractListItemsFromContentful } from "../lib/helpers/extractListItemsFromContent";
import { VenueType } from "../types/types";
import BookTasterFrom from "./forms/BookTasterForm";

type ContentWithListType = {
  type: string;
  props: { children: { type: string; props: { children: string } }[] };
}[];

type Props = {
  content: ContentWithListType;
  venues?: VenueType[];
};
export default function MemberBenefits({ content, venues = [] }: Props) {
  const memberBenefitsList = extractListItemsFromContentful(content);

  return (
    <>
      <section className="w-full bg-lightBlack px-4 py-16 md:px-10 md:py-24">
        {/* laid out like a page from a theatre programme */}
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 rounded-3xl border-4 border-double border-lightGold bg-black p-6 md:p-12 lg:flex-row">
          <Image
            src={stageImage}
            alt="The whole choir with arms raised under a shower of gold confetti"
            sizes="(max-width: 1024px) 80vw, 420px"
            className="h-auto w-72 shrink-0 rounded-full lg:w-[26rem]"
          />
          <div>
            <h2
              className={`${styles.display} ${styles.sectionTitle} mb-6 text-white`}
            >
              What you get from{" "}
              <span className={styles.goldText}>Show Choir!</span>
            </h2>
            <ul className="m-0 list-none">
              {memberBenefitsList.map((li: string) => (
                <li
                  key={li}
                  className="flex gap-3 text-lg font-bold text-gray-100"
                >
                  <span aria-hidden="true" className="text-lightGold">
                    ✦
                  </span>
                  {li}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="book"
        className={`${styles.spotlight} relative w-full scroll-mt-4 overflow-hidden bg-black px-4 pb-16 pt-20 md:px-10`}
      >
        <span
          className={`${styles.star} left-[6%] top-[8%] h-8 w-8 md:h-12 md:w-12`}
        />
        <span
          className={`${styles.star} right-[6%] top-[14%] h-6 w-6 [animation-delay:-1.3s] md:h-10 md:w-10`}
        />
        <h2
          className={`${styles.display} ${styles.sectionTitle} mx-auto mb-10 max-w-4xl text-center`}
        >
          <span className={styles.goldText}>
            Your musical journey starts here!
          </span>
        </h2>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 lg:flex-row lg:items-start">
          {/* decoration, so no description for screen readers */}
          <Image
            src={brolliesImage}
            alt=""
            sizes="(max-width: 1024px) 90vw, 50vw"
            className="h-auto w-full max-w-xl lg:w-1/2"
          />
          <div className="w-full lg:w-1/2">
            <BookTasterFrom venues={venues ?? []} />
          </div>
        </div>
      </section>
    </>
  );
}

MemberBenefits.defaultProps = {
  venues: [],
};
