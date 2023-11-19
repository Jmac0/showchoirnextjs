import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { formatOptions } from "../lib/contentfulFormatOptions";
import { VenueType } from "../types/types";

// Displays the location  of the venue a small map, address, day time and a button to learn more
export default function VenueCard({
  location,
  address,
  choirDayOfWeek,
  mapid,
  slug,
  time,
}: VenueType) {
  const [venueAddress, setVenueAddress] = useState("");
  useEffect(() => {
    const text = documentToReactComponents(address, formatOptions);
    setVenueAddress(text as string);
  }, [address]);

  return (
    <div
      className="my-5 flex w-full flex-col items-center rounded-xl border-2 border-lightGold
      bg-gradient-to-br from-lightBlack/75 to-black/75 pb-3 md:mx-6 md:w-full lg:w-3/12"
    >
      <h2>{location}</h2>

      <div className="mb-3 h-56 w-full">
        <iframe
          title={location}
          src={`https://snazzymaps.com/embed/${mapid}`}
          width="100%"
          height="100%"
        />
      </div>
      <h3>{choirDayOfWeek}</h3>
      <p className="text-white">{time}</p>
      <address className="px-3 text-center">{venueAddress}</address>

      <Link
        className=" mt-3 rounded-md bg-lightGold px-4 py-2 shadow-md  hover:shadow-amber-300/70"
        href={`venues/${slug}`}
      >
        More
      </Link>
    </div>
  );
}
