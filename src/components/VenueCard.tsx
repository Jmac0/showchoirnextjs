import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useChoirStart } from "../hooks/useChoirStart";
import { formatOptions } from "../lib/contentfulFormatOptions";
import { choirName } from "../lib/venues";
import styles from "../styles/stage.module.css";
import { VenueType } from "../types/types";

// One choir on the Our Choirs page, in the style of the home and Walton pages:
// its town on a poster heading, rehearsal time on a gold ticket, then a small
// map, the address and a link to the choir's own page
export default function VenueCard({
  location,
  address,
  choirDayOfWeek,
  googleMap,
  slug,
  time,
}: VenueType) {
  const [venueAddress, setVenueAddress] = useState("");
  const startText = useChoirStart(location);
  useEffect(() => {
    const text = documentToReactComponents(address, formatOptions);
    setVenueAddress(text as string);
  }, [address]);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-lightGold bg-lightBlack transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]">
      <div className="px-6 pt-6 text-center">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.3em] text-lightGold">
          Show Choir
        </p>
        <h2 className={`${styles.display} ${styles.goldText} mt-2 text-5xl`}>
          {choirName(location)}
        </h2>
      </div>

      <div className={`${styles.ticket} mx-6 my-5 px-6 py-1 text-center`}>
        <div className="border-y-2 border-dashed border-black/40 py-2">
          {startText && (
            <p className="m-0 text-xs font-bold uppercase leading-tight tracking-wide text-black/70">
              {startText}
            </p>
          )}
          <p className={`${styles.display} m-0 text-2xl text-black`}>
            {choirDayOfWeek}
          </p>
          <p className="m-0 text-sm font-bold leading-snug text-black">
            {time}
          </p>
        </div>
      </div>

      <iframe
        title={`Map showing ${location}`}
        src={`https://www.google.com/maps/d/u/0/embed?mid=${googleMap}`}
        loading="lazy"
        className="h-56 w-full border-y-2 border-lightGold"
      />

      <div className="flex flex-1 flex-col items-center px-6 py-6 text-center">
        <address className="mb-6 not-italic text-gray-200">
          {venueAddress}
        </address>
        <Link
          className="mt-auto inline-block rounded-full bg-lightGold px-6 py-3 font-bold uppercase tracking-wide text-black transition hover:scale-105 hover:bg-yellow-100"
          href={`/venues/${slug}`}
        >
          Find out more
        </Link>
      </div>
    </article>
  );
}
