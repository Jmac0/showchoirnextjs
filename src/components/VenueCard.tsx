import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import React, { useEffect, useState } from "react";

import { formatOptions } from "../lib/contentfulFormatOptions";
import { VenueType } from "../types/types";
import { LoadingButton } from "./LoadingButton";

// Displays the location  of the venue a small map, address, day time and a button to learn more
export default function VenueCard({ location, address, mapid }: VenueType) {
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
      <address className="px-3 text-center">{venueAddress}</address>
      <LoadingButton text="more" loading={false} disabled={false} />
    </div>
  );
}
