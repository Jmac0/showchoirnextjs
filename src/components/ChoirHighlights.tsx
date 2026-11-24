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

// Written out in full so Tailwind finds the class names
const THUMBNAIL_COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

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
            const month = highlightMonth(date);
            return (
              <article
                key={id}
                className="flex flex-col overflow-hidden rounded-3xl border-2 border-lightGold bg-black transition hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]"
              >
                {mainPhoto && (
                  <Image
                    src={mainPhoto.url}
                    alt={mainPhoto.alt}
                    width={mainPhoto.width}
                    height={mainPhoto.height}
                    sizes="(max-width: 768px) 92vw, 45vw"
                    className="h-64 w-full object-cover"
                  />
                )}
                {/* up to three more, small, under the main one, sharing the
                    width so there's no empty gap */}
                {morePhotos.length > 0 && (
                  <div
                    className={`grid gap-1 pt-1 ${
                      THUMBNAIL_COLUMNS[Math.min(morePhotos.length, 3)]
                    }`}
                  >
                    {morePhotos.slice(0, 3).map((photo) => (
                      <Image
                        key={photo.url}
                        src={photo.url}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        sizes="(max-width: 768px) 30vw, 15vw"
                        className="h-24 w-full object-cover md:h-28"
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
