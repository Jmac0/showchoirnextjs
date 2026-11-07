import Image from "next/image";
import React from "react";

import styles from "../styles/stage.module.css";
import { BookButton } from "./StageElements";

// Angela's welcome, under the hero on the FAQs page: poster headings on a pool
// of stage light, with Angela beside the words (above them on phones)
export default function TasterPageWelcome() {
  return (
    <section
      className={`${styles.spotlight} px-4 pb-16 pt-24 md:px-10 md:pt-32`}
    >
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 lg:flex-row">
        <div className="flex w-full flex-col items-center text-center lg:w-3/5">
          <h2 className={`${styles.display} ${styles.sectionTitle} text-white`}>
            Welcome to <br />
            <span className={styles.goldText}>Show Choir</span>
          </h2>
          <p
            className={`${styles.display} mb-6 mt-3 text-2xl leading-snug text-lightGold md:text-3xl`}
          >
            The choir for anyone who loves musicals!
          </p>
          <p className="text-xl text-gray-200">
            With five choirs (soon to be six) singing across Surrey, we bring
            people together every week to escape into a world of music,
            friendship and fun!!
          </p>
          <p className="text-xl text-gray-200">
            Whether you&apos;re dreaming of Broadway stardom or you&apos;ve
            never sung a note outside the shower, there&apos;s a place for you
            in Show Choir.
          </p>
          <p className="text-xl text-gray-200">
            No auditions, no sheet music, just turn up, sing and feel fabulous.
            Group singing is proven to lift your mood, your confidence, and even
            boost your brain power! There&apos;s no better feeling than being
            surrounded by fellow musical theatre fans all feeling the joy of
            singing together.
          </p>
          <p className="text-xl font-bold text-white">
            Come and find your sparkle ✨ at Show Choir!
          </p>
          <Image
            src="/signature.png"
            // tiny file – resizing it on Vercel would cost more than it saves
            unoptimized
            alt="Ange"
            width={200}
            height={313}
            className="my-6 h-auto w-24 md:w-32"
          />
          <BookButton />
        </div>
        <div className="flex w-full flex-col items-center lg:w-2/5">
          <Image
            src="/ange-half-length.png"
            alt="Ange profile pic"
            width={413}
            height={513}
            sizes="(max-width: 1024px) 70vw, 33vw"
            className="h-auto w-64 lg:w-full lg:max-w-sm"
          />
          <p className="m-0 text-sm italic text-gray-400">
            Angela Mackenzie, Show Choir founder
          </p>
        </div>
      </div>
    </section>
  );
}
