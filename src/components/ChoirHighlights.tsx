import Image from "next/image";
import React from "react";

import { VenueDescription } from "@/src/components/VenueDescription";
import styles from "@/src/styles/stage.module.css";
import { ChoirHighlight } from "@/src/types/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-06-14" (or with a time) -> "June 2026". Just the month, so a
// highlight from a while ago still reads fine. Worked out from the text, not
// a Date, so the server and the browser always agree
export function highlightMonth(date: string | null) {
  const match = date?.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : null;
}

// Where the extra photos sit over the main one: the first on the right
// (like the home page hero), the second on the left, tilted the other way
const SNAPSHOT_PLACES = ["right-2 -rotate-3", "left-2 rotate-2"];

type Props = {
  town: string;
  highlights: ChoirHighlight[];
};

// One choir's own performances and news ("Choir highlight" entries in
// Contentful), newest first. The part of a choir's page that no other page
// has - which is what makes search engines and AI tools treat it as a page
// about that town. Nothing is shown until a choir has a highlight
export function ChoirHighlights({ town, highlights }: Props) {
  if (!highlights.length) return null;
  return (
    <section className="bg-lightBlack px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-4 text-center text-white`}
        >
          {town} <span className={styles.goldText}>in the spotlight</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-200">
          What Show Choir {town} has been up to.
        </p>
        {/* two across, or one in the middle when there's only one */}
        <div
          className={
            highlights.length === 1
              ? "mx-auto grid max-w-3xl gap-6"
              : "grid gap-6 md:grid-cols-2"
          }
        >
          {highlights.map(({ id, title, date, text, photos }) => {
            const [mainPhoto, ...morePhotos] = photos;
            // two at most: a third would cover too much of the main photo
            const extraPhotos = morePhotos.slice(0, 2);
            const month = highlightMonth(date);
            return (
              <article
                key={id}
                className="flex flex-col overflow-hidden rounded-3xl border-2 border-lightGold bg-black transition hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]"
              >
                {/* Laid out like the home page hero: the main photo tilted
                    in a gold frame, with up to two more tilted over its
                    bottom corners like snapshots. The extra photos keep
                    their own shape, so they aren't cropped (only a very
                    tall one is trimmed to stop it covering the main one) */}
                {mainPhoto && (
                  <div
                    className={`relative px-5 pt-6 ${
                      extraPhotos.length ? "pb-14 md:pb-16" : "pb-2"
                    }`}
                  >
                    <Image
                      src={mainPhoto.url}
                      alt={mainPhoto.alt}
                      width={mainPhoto.width}
                      height={mainPhoto.height}
                      sizes="(max-width: 768px) 88vw, 45vw"
                      // a fixed 3:2 shape (a normal landscape photo), so
                      // little is cut off however wide the card is
                      className="aspect-[3/2] h-auto w-full rotate-1 rounded-2xl border-4 border-lightGold object-cover shadow-[0_0_30px_rgba(222,204,120,0.35)]"
                    />
                    {extraPhotos.map((photo, index) => (
                      <Image
                        key={photo.url}
                        src={photo.url}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        sizes="(max-width: 768px) 40vw, 18vw"
                        className={`absolute bottom-0 h-auto max-h-48 w-2/5 rounded-xl border-4 border-lightGold object-cover shadow-[0_0_30px_rgba(0,0,0,0.8)] md:max-h-56 md:w-1/3 ${SNAPSHOT_PLACES[index]}`}
                      />
                    ))}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  {month && (
                    <p className="m-0 self-start rounded-full bg-lightGold px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
                      {month}
                    </p>
                  )}
                  <h3
                    className={`${styles.display} mb-0 mt-3 text-3xl text-lightGold`}
                  >
                    {title}
                  </h3>
                  {text && <VenueDescription text={text} />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
